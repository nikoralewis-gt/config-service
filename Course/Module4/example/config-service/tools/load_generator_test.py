#!/usr/bin/env python3
"""
Unit tests for the load generation tool using pytest-httpx.

Tests focus on verifying actual HTTP request patterns, counts, and timing
rather than complex manual mocking.
"""

import asyncio
import re
import sys
import os
from unittest import mock

import pytest
import httpx
from pytest_httpx import HTTPXMock

# Import the load generator module
sys.path.insert(0, os.path.dirname(__file__))
from load_generator import (
    get_available_scenarios,
    run_load_scenario,
    _request_volume_load,
    _large_payload_load,
    _db_connection_load,
    _error_stress_load,
    _mixed_load,
    SCENARIOS
)


class TestLoadGeneratorPublicInterface:
    """Test the public interface functions."""

    def test_get_available_scenarios(self):
        """Test that available scenarios are returned correctly."""
        scenarios = get_available_scenarios()

        assert isinstance(scenarios, list)
        assert len(scenarios) > 0
        assert "high_volume_reads" in scenarios

    @pytest.mark.asyncio
    async def test_run_load_scenario_invalid_scenario(self):
        """Test that invalid scenario names raise appropriate errors."""
        with pytest.raises(ValueError, match="Unknown scenario 'nonexistent'"):
            await run_load_scenario("nonexistent", "http://localhost:8000")

    @pytest.mark.asyncio
    @mock.patch("load_generator._request_volume_load")
    async def test_run_load_scenario_timing_metadata(self, mock_volume_load, httpx_mock: HTTPXMock):
        """Test that timing metadata is properly calculated."""
        mock_volume_load.return_value = {"pattern": "request_volume"}

        loop = asyncio.get_event_loop()
        start_time = loop.time()
        result = await run_load_scenario("high_volume_reads", "http://localhost:8000")
        end_time = loop.time()

        assert result["scenario_name"] == "high_volume_reads"
        assert result["planned_duration"] == 30
        assert start_time <= result["start_time"] <= result["end_time"] <= end_time
        assert len(httpx_mock.get_requests()) == 0


@pytest.mark.asyncio
class TestRequestVolumeLoad:
    """Test the request volume load generation."""

    async def test_request_volume_load_request_count(self, httpx_mock: HTTPXMock):
        """Test that the correct number of requests are made."""
        for _ in range(10):
            httpx_mock.add_response(json={"status": "ok"})

        scenario = {"num_requests": 10, "endpoints": ["/api/v1/applications"]}

        async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
            result = await _request_volume_load(scenario, client)

        assert len(httpx_mock.get_requests()) == 10
        assert result["total_requests"] == 10
        assert result["success_count"] == 10

    async def test_request_volume_load_error_handling(self, httpx_mock: HTTPXMock):
        """Test error handling with failing requests."""
        httpx_mock.add_response(status_code=200)
        httpx_mock.add_response(status_code=500)
        httpx_mock.add_response(status_code=200)
        httpx_mock.add_response(status_code=404)

        scenario = {"num_requests": 4, "endpoints": ["/api/v1/applications"]}

        async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
            result = await _request_volume_load(scenario, client)

        assert len(httpx_mock.get_requests()) == 4
        assert result["success_count"] == 2
        assert result["error_count"] == 2


@pytest.mark.asyncio
class TestLargePayloadLoad:
    """Test large payload load generation."""

    async def test_large_payload_load_request_count(self, httpx_mock: HTTPXMock):
        """Test that a deterministic number of requests are made."""
        httpx_mock.add_response(status_code=201, json={"id": "test-123"})
        httpx_mock.add_response(status_code=201, json={"id": "test-456"})

        scenario = {"num_requests": 2, "payload_kb": 100}

        async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
            result = await _large_payload_load(scenario, client)

        assert len(httpx_mock.get_requests()) == 2
        assert result["success_count"] == 2

    async def test_large_payload_load_payload_size(self, httpx_mock: HTTPXMock):
        """Test that payloads are actually large."""
        httpx_mock.add_response(status_code=201, json={"id": "test-123"})

        scenario = {"num_requests": 1, "payload_kb": 200}

        async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
            await _large_payload_load(scenario, client)

        requests = httpx_mock.get_requests()
        assert len(requests) == 1
        content_length = len(requests[0].content)
        assert 180_000 < content_length < 250_000

    async def test_large_payload_load_app_tracking(self, httpx_mock: HTTPXMock):
        """Test that created application IDs are tracked."""
        httpx_mock.add_response(status_code=201, json={"id": "app-123"})
        httpx_mock.add_response(status_code=201, json={"id": "app-456"})

        scenario = {"num_requests": 2, "payload_kb": 50}

        async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
            result = await _large_payload_load(scenario, client)

        assert len(result["created_app_ids"]) == 2
        assert "app-123" in result["created_app_ids"]
        assert "app-456" in result["created_app_ids"]


@pytest.mark.asyncio
class TestDbConnectionLoad:
    """Test database connection load generation."""

    async def test_db_connection_load_requests(self, httpx_mock: HTTPXMock):
        """Test that concurrent requests are made properly."""
        for _ in range(3):
            httpx_mock.add_response(status_code=200)

        scenario = {"num_requests": 3, "concurrent_connections": 3, "endpoints": ["/api/v1/applications"]}

        async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
            result = await _db_connection_load(scenario, client)

        assert len(httpx_mock.get_requests()) == 3
        assert result["total_requests"] == 3

    async def test_db_connection_load_id_replacement(self, httpx_mock: HTTPXMock):
        """Test that {id} placeholders are replaced."""
        httpx_mock.add_response(method="POST", json={"id": "app-abc123"}, status_code=201)
        httpx_mock.add_response(method="GET", url=re.compile(r".*/api/v1/applications/app-abc123$"))

        scenario = {
            "num_requests": 1,
            "concurrent_connections": 1,
            "endpoints": ["/api/v1/applications/{id}"]
        }

        async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
            await _db_connection_load(scenario, client)

        # The GET request is what we want to validate
        get_requests = httpx_mock.get_requests(method="GET")
        assert len(get_requests) == 1
        assert "app-abc123" in str(get_requests[0].url)


@pytest.mark.asyncio
class TestErrorStressLoad:
    """Test error stress load generation."""

    async def test_error_stress_load_oversized(self, httpx_mock: HTTPXMock):
        """Test error stress with oversized payloads."""
        httpx_mock.add_response(status_code=422)
        httpx_mock.add_response(status_code=422)

        scenario = {"num_requests": 2, "error_types": ["oversized_payloads"]}

        async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
            result = await _error_stress_load(scenario, client)

        assert len(httpx_mock.get_requests()) == 2
        assert result["error_breakdown"]["oversized_payloads"] == 2

    async def test_error_stress_load_invalid_endpoints(self, httpx_mock: HTTPXMock):
        """Test error stress with invalid endpoints."""
        httpx_mock.add_response(status_code=404)

        scenario = {"num_requests": 1, "error_types": ["invalid_endpoints"]}

        async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
            result = await _error_stress_load(scenario, client)

        assert len(httpx_mock.get_requests()) == 1
        assert result["error_breakdown"]["invalid_endpoints"] == 1


@pytest.mark.asyncio
class TestMixedLoad:
    """Test mixed load generation."""

    @mock.patch("load_generator._db_connection_load")
    @mock.patch("load_generator._large_payload_load")
    @mock.patch("load_generator._request_volume_load")
    async def test_mixed_load_components_execution(self, mock_volume, mock_payload, mock_db):
        """Test that all component scenarios are executed in mixed load."""
        mock_volume.return_value = {"success_count": 10, "error_count": 0, "total_requests": 10}
        mock_payload.return_value = {"success_count": 5, "error_count": 1, "total_requests": 6}
        mock_db.return_value = {"success_count": 2, "error_count": 2, "total_requests": 4}

        scenario = {
            "duration": 6,
            "components": ["high_volume_reads", "large_config_creates", "connection_pool_stress"]
        }

        async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
            result = await _mixed_load(scenario, client)

        assert result["pattern"] == "mixed"
        assert len(result["component_results"]) == 3
        assert mock_volume.called
        assert mock_payload.called
        assert mock_db.called
        assert result["total_requests"] == 20
        assert result["success_count"] == 17
        assert result["error_count"] == 3


class TestScenarioValidation:
    """Test scenario configuration validation."""

    def test_all_scenarios_have_required_fields(self):
        """Test that all predefined scenarios have required fields."""
        for name, config in SCENARIOS.items():
            assert "duration" in config
            assert "pattern" in config

    def test_mixed_scenario_components_exist(self):
        """Test that mixed scenario components reference valid scenarios."""
        for name, config in SCENARIOS.items():
            if config["pattern"] == "mixed":
                for component in config.get("components", []):
                    assert component in SCENARIOS
                    assert SCENARIOS[component]["pattern"] != "mixed"