#!/usr/bin/env python3
"""
Load Generation Tool for Configuration Service Capacity Monitoring

Generates realistic load patterns to test container resource usage and pool capacity metrics.
Supports named scenarios with different stress patterns for capacity analysis.
"""

import asyncio
import json
import random
import string
import time
from typing import Any, Dict, List, Optional

import httpx

# Pre-defined Load Scenarios
SCENARIOS = {
    "high_volume_reads": {
        "duration": 30,
        "pattern": "request_volume",
        "rps": 50,
        "endpoints": ["/api/v1/applications", "/api/v1/config/test-app"]
    },
    "large_config_creates": {
        "duration": 60,
        "pattern": "large_payload",
        "payload_kb": 512,  # Stay under 1MB limit (1024KB)
        "endpoints": ["/api/v1/applications"]
    },
    "large_config_updates": {
        "duration": 45,
        "pattern": "large_payload",
        "payload_kb": 768,  # Larger updates
        "endpoints": ["/api/v1/applications/{id}/config"]
    },
    "connection_pool_stress": {
        "duration": 45,
        "pattern": "db_connections",
        "concurrent_connections": 18,
        "endpoints": ["/api/v1/applications", "/api/v1/applications/{id}"]
    },
    "error_stress_testing": {
        "duration": 30,
        "pattern": "error_stress",
        "error_types": ["oversized_payloads", "invalid_endpoints", "malformed_json"],
        "endpoints": ["/api/v1/applications", "/api/v1/nonexistent"]
    },
    "mixed_realistic_load": {
        "duration": 120,
        "pattern": "mixed",
        "components": ["high_volume_reads", "large_config_creates", "connection_pool_stress"]
    }
}


def get_available_scenarios() -> List[str]:
    """Return list of available load scenario names."""
    return list(SCENARIOS.keys())


async def run_load_scenario(scenario_name: str, base_url: str) -> Dict[str, Any]:
    """
    Execute a named load scenario against the Configuration Service.

    Args:
        scenario_name: Name of the predefined scenario to run
        base_url: Base URL of the Configuration Service (e.g., http://localhost:8000)

    Returns:
        Dictionary with load execution results including timing, success/error counts, and metrics
    """
    if scenario_name not in SCENARIOS:
        raise ValueError(f"Unknown scenario '{scenario_name}'. Available: {get_available_scenarios()}")

    scenario = SCENARIOS[scenario_name]
    print(f"Starting load scenario '{scenario_name}' for {scenario.get('duration', 0)}s...")

    loop = asyncio.get_event_loop()
    start_time = loop.time()

    # Use an async client for all scenarios
    async with httpx.AsyncClient(base_url=base_url, timeout=30.0) as client:
        if scenario["pattern"] == "request_volume":
            result = await _request_volume_load(scenario, client)
        elif scenario["pattern"] == "large_payload":
            result = await _large_payload_load(scenario, client)
        elif scenario["pattern"] == "db_connections":
            result = await _db_connection_load(scenario, client)
        elif scenario["pattern"] == "error_stress":
            result = await _error_stress_load(scenario, client)
        elif scenario["pattern"] == "mixed":
            result = await _mixed_load(scenario, client)
        else:
            raise ValueError(f"Unknown load pattern '{scenario['pattern']}'")

    end_time = loop.time()
    actual_duration = end_time - start_time

    # Add timing and scenario metadata
    result.update({
        "scenario_name": scenario_name,
        "planned_duration": scenario.get("duration", 0),
        "actual_duration": round(actual_duration, 2),
        "start_time": start_time,
        "end_time": end_time
    })

    print(f"Completed scenario '{scenario_name}' in {actual_duration:.2f}s")
    return result


async def _request_volume_load(
    scenario: Dict[str, Any], client: httpx.AsyncClient
) -> Dict[str, Any]:
    """Generate high-frequency requests to existing endpoints."""
    duration = scenario.get("duration", 1)
    rps = scenario.get("rps", 1)
    endpoints = scenario["endpoints"]
    num_requests = scenario.get("num_requests")

    total_requests = num_requests if num_requests is not None else duration * rps
    request_interval = 1.0 / rps if rps > 0 else 0

    results: Dict[str, Any] = {
        "pattern": "request_volume",
        "success_count": 0,
        "error_count": 0,
        "total_requests": total_requests,
        "target_rps": rps,
        "response_times": [],
    }

    async def make_request():
        endpoint = random.choice(endpoints)
        try:
            start = time.time()
            response = await client.get(endpoint)
            end = time.time()
            results["response_times"].append(end - start)
            if response.status_code < 400:
                results["success_count"] += 1
            else:
                results["error_count"] += 1
        except Exception:
            results["error_count"] += 1

    tasks = []
    for i in range(total_requests):
        tasks.append(asyncio.create_task(make_request()))
        if request_interval > 0:
            await asyncio.sleep(request_interval)

    await asyncio.gather(*tasks)

    if results["response_times"]:
        results["avg_response_time"] = sum(results["response_times"]) / len(results["response_times"])
        results["max_response_time"] = max(results["response_times"])
        results["min_response_time"] = min(results["response_times"])

    return results


async def _large_payload_load(
    scenario: Dict[str, Any], client: httpx.AsyncClient
) -> Dict[str, Any]:
    """Create/update applications with large JSON configurations."""
    duration = scenario.get("duration", 1)
    payload_kb = scenario["payload_kb"]
    num_requests = scenario.get("num_requests")

    payload_bytes = payload_kb * 1024

    def generate_large_config():
        config = {"features": {}, "settings": {}, "data": {}}
        remaining_bytes = payload_bytes
        while remaining_bytes > 100:
            key = ''.join(random.choices(string.ascii_letters, k=20))
            value = ''.join(random.choices(string.ascii_letters + string.digits, k=min(1000, remaining_bytes // 4)))
            config["data"][key] = value
            remaining_bytes -= len(json.dumps({key: value}))
        return config

    results: Dict[str, Any] = {
        "pattern": "large_payload",
        "success_count": 0,
        "error_count": 0,
        "payload_size_kb": payload_kb,
        "created_app_ids": [],
    }

    async def make_request(req_id: int):
        try:
            config = generate_large_config()
            app_data = {
                "name": f"load_test_app_{int(time.time())}_{req_id}",
                "description": "Load testing application with large configuration",
                "config": config,
            }
            response = await client.post("/api/v1/applications", json=app_data)
            if response.status_code < 400:
                results["success_count"] += 1
                if response.status_code == 201:
                    app_info = response.json()
                    results["created_app_ids"].append(app_info.get("id"))
            else:
                results["error_count"] += 1
        except Exception:
            results["error_count"] += 1

    tasks = []
    if num_requests is not None:
        for i in range(num_requests):
            tasks.append(asyncio.create_task(make_request(i)))
    else:
        start_time = asyncio.get_event_loop().time()
        request_count = 0
        while asyncio.get_event_loop().time() - start_time < duration:
            tasks.append(asyncio.create_task(make_request(request_count)))
            request_count += 1
            await asyncio.sleep(1)

    await asyncio.gather(*tasks)
    results["total_requests"] = len(tasks)
    return results


async def _db_connection_load(
    scenario: Dict[str, Any], client: httpx.AsyncClient
) -> Dict[str, Any]:
    """Generate many concurrent requests that hold database connections."""
    duration = scenario.get("duration", 1)
    concurrent_connections = scenario["concurrent_connections"]
    endpoints = scenario["endpoints"]
    num_requests = scenario.get("num_requests")

    results: Dict[str, Any] = {
        "pattern": "db_connections",
        "success_count": 0,
        "error_count": 0,
        "concurrent_connections": concurrent_connections,
        "total_requests": 0,
    }

    async def long_running_request():
        endpoint = random.choice(endpoints)
        if "{id}" in endpoint:
            try:
                app_response = await client.post(
                    "/api/v1/applications",
                    json={
                        "name": f"db_load_test_{int(time.time())}_{random.randint(1000, 9999)}",
                        "description": "Database load test app",
                    },
                )
                if app_response.status_code == 201:
                    app_id = app_response.json()["id"]
                    endpoint = endpoint.replace("{id}", app_id)
                else:
                    endpoint = "/api/v1/applications"
            except Exception:
                endpoint = "/api/v1/applications"

        try:
            response = await client.get(endpoint)
            if response.status_code < 400:
                results["success_count"] += 1
            else:
                results["error_count"] += 1
        except Exception:
            results["error_count"] += 1
        results["total_requests"] += 1

    tasks = []
    if num_requests is not None:
        for _ in range(num_requests):
            tasks.append(asyncio.create_task(long_running_request()))
    else:
        start_time = asyncio.get_event_loop().time()
        while asyncio.get_event_loop().time() - start_time < duration:
            batch = [
                asyncio.create_task(long_running_request())
                for _ in range(concurrent_connections)
            ]
            tasks.extend(batch)
            await asyncio.gather(*batch)
            await asyncio.sleep(0.5)

    await asyncio.gather(*tasks)
    return results


async def _error_stress_load(
    scenario: Dict[str, Any], client: httpx.AsyncClient
) -> Dict[str, Any]:
    """Generate high error rates via various failure conditions."""
    duration = scenario.get("duration", 1)
    error_types = scenario["error_types"]
    num_requests = scenario.get("num_requests")

    results: Dict[str, Any] = {
        "pattern": "error_stress",
        "success_count": 0,
        "error_count": 0,
        "error_breakdown": {error_type: 0 for error_type in error_types},
        "total_requests": 0,
    }

    async def generate_error_request():
        error_type = random.choice(error_types)
        response = None
        try:
            if error_type == "oversized_payloads":
                large_config = {"data": "x" * (1024 * 1024 + 1000)}
                app_data = {
                    "name": f"oversized_test_{int(time.time())}",
                    "config": large_config,
                }
                response = await client.post("/api/v1/applications", json=app_data)
            elif error_type == "invalid_endpoints":
                response = await client.get("/api/v1/nonexistent")
            elif error_type == "malformed_json":
                response = await client.post(
                    "/api/v1/applications",
                    content='{"invalid": json}',
                    headers={"Content-Type": "application/json"},
                )

            results["error_breakdown"][error_type] += 1
            if response and response.status_code < 400:
                results["success_count"] += 1
            else:
                results["error_count"] += 1
        except Exception:
            results["error_count"] += 1
            results["error_breakdown"][error_type] += 1
        results["total_requests"] += 1

    tasks = []
    if num_requests is not None:
        for _ in range(num_requests):
            tasks.append(asyncio.create_task(generate_error_request()))
    else:
        start_time = asyncio.get_event_loop().time()
        while asyncio.get_event_loop().time() - start_time < duration:
            tasks.append(asyncio.create_task(generate_error_request()))
            await asyncio.sleep(0.1)

    await asyncio.gather(*tasks)
    return results


async def _mixed_load(
    scenario: Dict[str, Any], client: httpx.AsyncClient
) -> Dict[str, Any]:
    """Run multiple load patterns simultaneously."""
    duration = scenario.get("duration", 1)
    components = scenario["components"]

    results: Dict[str, Any] = {
        "pattern": "mixed",
        "component_results": {},
        "total_duration": duration,
    }

    component_duration = duration // len(components)

    async def run_component(component_name):
        component_scenario = SCENARIOS[component_name].copy()
        component_scenario["duration"] = component_duration
        # This is a simplification; a real mixed load might need a shared client
        async with httpx.AsyncClient(base_url=client.base_url, timeout=30.0) as component_client:
            if component_scenario["pattern"] == "request_volume":
                return await _request_volume_load(component_scenario, component_client)
            elif component_scenario["pattern"] == "large_payload":
                return await _large_payload_load(component_scenario, component_client)
            elif component_scenario["pattern"] == "db_connections":
                return await _db_connection_load(component_scenario, component_client)
            elif component_scenario["pattern"] == "error_stress":
                return await _error_stress_load(component_scenario, component_client)

    component_tasks = [
        asyncio.create_task(run_component(name)) for name in components
    ]
    component_results_list = await asyncio.gather(*component_tasks)

    for i, component_name in enumerate(components):
        results["component_results"][component_name] = component_results_list[i]

    total_success = sum(r.get("success_count", 0) for r in results["component_results"].values())
    total_error = sum(r.get("error_count", 0) for r in results["component_results"].values())
    total_requests = sum(r.get("total_requests", 0) for r in results["component_results"].values())

    results.update({
        "success_count": total_success,
        "error_count": total_error,
        "total_requests": total_requests,
    })
    return results


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python load_generator.py <scenario_name> [base_url]")
        print(f"Available scenarios: {', '.join(get_available_scenarios())}")
        sys.exit(1)

    scenario_name_arg = sys.argv[1]
    base_url_arg = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8000"

    if scenario_name_arg == "list":
        print("Available load scenarios:")
        for name, scenario_config in SCENARIOS.items():
            print(f"  {name}: {scenario_config.get('pattern', 'unknown')} pattern, {scenario_config.get('duration', 0)}s duration")
        sys.exit(0)

    try:
        main_result = asyncio.run(run_load_scenario(scenario_name_arg, base_url_arg))
        print()
        print("Load Generation Results:")
        print(json.dumps(main_result, indent=2, default=str))
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
