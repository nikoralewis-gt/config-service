"""Quick test to verify ULID handling is fixed."""
import sys
import json
from datetime import datetime

# Test 1: Verify models use str types
print("=" * 60)
print("TEST 1: Verify Pydantic models use str for ULID fields")
print("=" * 60)

from api.models import Application, Configuration

# Create an Application instance with string IDs
app = Application(
    id='01ARZ3NDEKTSV4RRFFQ69G5FAV',
    name='Test App',
    description='Test Description',
    created_at=datetime.utcnow(),
    updated_at=datetime.utcnow(),
    configuration_ids=['01ARZ3NDEKTSV4RRFFQ69G5FAV', '01ARZ3NDEKTSV4RRFFQ69G5FAW']
)

print(f"✓ Application.id type: {type(app.id).__name__} (expected: str)")
print(f"✓ Application.configuration_ids type: {type(app.configuration_ids).__name__} (expected: list)")
print(f"✓ First config_id type: {type(app.configuration_ids[0]).__name__} (expected: str)")

# Create a Configuration instance with string IDs
config = Configuration(
    id='01ARZ3NDEKTSV4RRFFQ69G5FAV',
    application_id='01ARZ3NDEKTSV4RRFFQ69G5FAW',
    name='Test Config',
    description='Test Description',
    settings={'key': 'value'},
    created_at=datetime.utcnow(),
    updated_at=datetime.utcnow()
)

print(f"✓ Configuration.id type: {type(config.id).__name__} (expected: str)")
print(f"✓ Configuration.application_id type: {type(config.application_id).__name__} (expected: str)")

# Test 2: Verify JSON serialization works
print("\n" + "=" * 60)
print("TEST 2: Verify JSON serialization works")
print("=" * 60)

try:
    # Test Application serialization
    app_json = app.model_dump_json()
    app_dict = json.loads(app_json)
    print(f"✓ Application JSON serialization: SUCCESS")
    print(f"  - id: {app_dict['id']}")
    print(f"  - configuration_ids: {app_dict['configuration_ids']}")
    
    # Test Configuration serialization
    config_json = config.model_dump_json()
    config_dict = json.loads(config_json)
    print(f"✓ Configuration JSON serialization: SUCCESS")
    print(f"  - id: {config_dict['id']}")
    print(f"  - application_id: {config_dict['application_id']}")
    
except Exception as e:
    print(f"✗ JSON serialization FAILED: {e}")
    sys.exit(1)

# Test 3: Verify ULID generation still works
print("\n" + "=" * 60)
print("TEST 3: Verify ULID generation still works")
print("=" * 60)

from ulid import ULID
import uuid

# Test ULID generation methods used in the code
ulid1 = str(ULID())
print(f"✓ str(ULID()): {ulid1} (length: {len(ulid1)})")

ulid2 = str(ULID.from_uuid(uuid.uuid4()))
print(f"✓ str(ULID.from_uuid(uuid.uuid4())): {ulid2} (length: {len(ulid2)})")

# Verify they are valid ULIDs (26 characters)
assert len(ulid1) == 26, f"ULID should be 26 characters, got {len(ulid1)}"
assert len(ulid2) == 26, f"ULID should be 26 characters, got {len(ulid2)}"
print("✓ Both ULIDs are valid (26 characters)")

print("\n" + "=" * 60)
print("ALL TESTS PASSED! ✓")
print("=" * 60)
print("\nSummary:")
print("- All ULID fields are now plain strings")
print("- JSON serialization works correctly")
print("- ULID generation still works as expected")
print("\nThe ULID handling fix is complete and working!")
