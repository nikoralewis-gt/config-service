# Configuration Service Observability

This document outlines the observability patterns and architecture for the Configuration Service, focusing on capacity monitoring and resource constraint tracking.

## Overview

The Configuration Service observability infrastructure is built around OpenTelemetry and provides three primary monitoring categories:

1. **Capacity Monitoring** - Resource constraint tracking (this implementation)
2. **Error Detection & Tracing** - Future observability category
3. **Performance Benchmarking** - Future observability category

## Infrastructure Components

### OpenTelemetry Stack
- **Collector**: Centralized telemetry data processing
- **Prometheus**: Metrics storage and querying
- **Grafana**: Visualization and dashboards
- **Jaeger** (future): Distributed tracing

### Configuration
- `observability/otel-collector.yml`: OpenTelemetry Collector configuration
- `observability/prometheus.yml`: Prometheus server configuration
- `observability/grafana/`: Dashboard and data source configurations

## Capacity Monitoring Architecture

### Objective
Track **"What can we exhaust?"** - the finite resources that constrain system capacity.

### Core Metric Pattern Templates

#### 1. Container Resource Gauges
**Pattern**: System-level resource utilization
**Use Case**: Track container-level constraints

```python
# Example metrics:
container_cpu_usage_percent{service="config-service"} 45.2
container_memory_usage_bytes{service="config-service"} 2147483648  # 2.1GB
```

**Implementation Guidelines**:
- CPU: Percentage of allocated cores
- Memory: Absolute bytes consumed
- Update frequency: 10-30 second intervals
- Labels: service, environment, instance_id

#### 2. Pool Capacity Gauges
**Pattern**: Finite resource pool utilization
**Use Case**: Track connection pools, thread pools, and other bounded resources

```python
# Example metrics:
db_connection_pool_active{service="config-service"} 15
db_connection_pool_total{service="config-service"} 20
db_connection_pool_idle{service="config-service"} 5

thread_pool_active{pool="database", service="config-service"} 8
thread_pool_total{pool="database", service="config-service"} 10
thread_pool_idle{pool="database", service="config-service"} 2
```

**Implementation Guidelines**:
- Always provide: active, total, idle counters
- Update frequency: Real-time on pool state changes
- Labels: service, pool_type, environment

### Database Connection Tracking

The `DatabasePool` class in `api/db_connection.py` implements manual connection tracking:

```python
class DatabasePool:
    def __init__(self):
        self._active_connections = 0
        self._connection_lock = asyncio.Lock()

    def get_pool_metrics(self) -> dict[str, int]:
        return {
            "active": self._active_connections,
            "total": self._pool.maxconn,
            "idle": max(0, self._pool.maxconn - self._active_connections)
        }
```

**Key Features**:
- Thread-safe connection counting with asyncio.Lock
- Robust error handling in try/catch blocks around getconn/putconn
- Real-time metrics availability via `get_pool_metrics()`

## Load Generation Tooling

### Purpose
Generate realistic load patterns to test container resource usage and pool capacity metrics.

### Tool Location
`tools/load_generator.py`

### Available Scenarios

#### High Volume Reads
```bash
make load high_volume_reads
```
- Duration: 30 seconds
- Rate: 50 requests/second
- Endpoints: `/api/v1/applications`, `/api/v1/config/test-app`
- Purpose: Test request throughput capacity

#### Large Configuration Operations
```bash
make load large_config_creates
make load large_config_updates
```
- Duration: 45-60 seconds
- Payload size: 512-768KB (under 1MB limit)
- Purpose: Test memory and processing capacity

#### Database Connection Stress
```bash
make load connection_pool_stress
```
- Duration: 45 seconds
- Concurrent connections: 18 (pool max: 20)
- Purpose: Test connection pool capacity constraints

#### Error Stress Testing
```bash
make load error_stress_testing
```
- Duration: 30 seconds
- Error types: oversized payloads, invalid endpoints, malformed JSON
- Purpose: Test system behavior under error conditions

#### Mixed Realistic Load
```bash
make load mixed_realistic_load
```
- Duration: 120 seconds
- Components: Combination of above patterns
- Purpose: Comprehensive capacity testing

### Load Generation Commands
```bash
# List available scenarios
make list-load-scenarios

# Run specific scenario
make load <scenario_name>

# Example usage
make load high_volume_reads
```

## Metrics Integration Patterns

### Expected Metrics Flow
1. **Load Generation**: Execute realistic scenarios using `tools/load_generator.py`
2. **Metric Collection**: Container and pool metrics collected by OpenTelemetry
3. **Storage**: Metrics stored in Prometheus
4. **Visualization**: Capacity dashboards in Grafana

### Testing Integration
When testing capacity monitoring features:

```python
# Integration test pattern
def test_prometheus_polling_integration():
    # 1. Generate load using load_generator
    # 2. Poll Prometheus for metrics (3s intervals, 20 attempts = 60s timeout)
    # 3. Validate metrics appear and reflect load patterns
```

### Dashboard Integration
Grafana dashboards should display:
- Container resource utilization with capacity constraint indicators
- Pool capacity metrics with utilization trends
- Time-series data during load scenario execution

## Future Expansion

### Container Resource Metrics (Task 1)
**Status**: Planned
**Scope**: CPU usage percentage and memory consumption metrics collection

### Advanced Pool Metrics (Task 2)
**Status**: Planned
**Scope**: Thread pool capacity metrics alongside database connections

### Comprehensive Dashboard (Task 3)
**Status**: Planned
**Scope**: Unified capacity monitoring dashboard with constraint indicators

## Implementation Notes

### Design Principles
- **Simplicity**: Metrics should be easy to understand and implement
- **Consistency**: Follow established patterns for similar resource types
- **Real-time**: Metrics should reflect current system state accurately
- **Scalability**: Pattern should work across different resource types

### Development Workflow
1. Implement metric collection using established patterns
2. Test with load generation scenarios
3. Validate metrics appear in Prometheus
4. Create or update Grafana dashboards
5. Document capacity thresholds and alerting rules

### Key Files
- `api/db_connection.py`: Database pool metrics implementation
- `tools/load_generator.py`: Load generation scenarios
- `observability/`: OpenTelemetry and Prometheus configuration
- `changes/001-capacity-monitoring.md`: Detailed implementation planning

This observability architecture provides a foundation for understanding resource utilization, predicting capacity limits, and preventing performance degradation before it impacts users.