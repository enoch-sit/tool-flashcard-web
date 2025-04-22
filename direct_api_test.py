import requests
import json
import argparse
from typing import Dict, Any, Optional


def log(message: str, verbose: bool):
    """Print log messages if verbose mode is enabled"""
    if verbose:
        print(f"[LOG] {message}")


def make_request(
    method: str,
    url: str,
    headers: Dict[str, str] = None,
    data: Dict[str, Any] = None,
    verbose: bool = False,
):
    """Make a request to the API with proper headers and error handling"""
    if headers is None:
        headers = {"Content-Type": "application/json"}

    log(f"Making {method} request to {url}", verbose)
    if data:
        log(f"With data: {json.dumps(data, indent=2)}", verbose)

    try:
        if method.lower() == "get":
            response = requests.get(url, headers=headers)
        elif method.lower() == "post":
            response = requests.post(url, headers=headers, json=data)
        elif method.lower() == "put":
            response = requests.put(url, headers=headers, json=data)
        elif method.lower() == "delete":
            response = requests.delete(url, headers=headers)
        else:
            log(f"Unsupported method: {method}", verbose)
            return None

        log(f"Response status: {response.status_code}", verbose)

        if response.status_code >= 200 and response.status_code < 300:
            if response.text:
                try:
                    result = response.json()
                    log(f"Response data: {json.dumps(result, indent=2)}", verbose)
                    return result
                except json.JSONDecodeError:
                    log(f"Response is not JSON: {response.text}", verbose)
                    return {"text": response.text}
            return {}
        else:
            error_msg = f"Error {response.status_code}"
            try:
                error_data = response.json()
                error_msg += f": {error_data.get('message', '')}"
            except:
                if response.text:
                    error_msg += f": {response.text}"
            log(f"Request failed: {error_msg}", verbose)
            return None

    except Exception as e:
        log(f"Exception occurred: {str(e)}", verbose)
        return None


def test_flashcard_api(api_url: str, token: str, verbose: bool):
    """Test the flashcard API endpoints with a provided token"""
    # Set up headers with the auth token
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}

    print("\n🔍 FLASHCARD API ENDPOINT TESTS 🔍\n")

    # Track test results
    passed = 0
    failed = 0
    total = 0

    # Track important IDs
    deck_id = None
    card_id = None

    # 1. Test health check endpoint
    total += 1
    print("\nTesting: Health Check")
    result = make_request("get", f"{api_url}/health", headers=None, verbose=verbose)
    if result is not None and result.get("status") == "ok":
        print("✅ PASS | Health check successful")
        passed += 1
    else:
        print("❌ FAIL | Health check failed")
        failed += 1

    # 2. Test create deck
    total += 1
    print("\nTesting: Create Deck")
    deck_data = {
        "name": "Test API Deck",
        "description": "A deck created via API testing",
        "isPublic": False,
    }
    result = make_request(
        "post", f"{api_url}/api/decks", headers=headers, data=deck_data, verbose=verbose
    )
    if result is not None and ("deck" in result or "message" in result):
        print("✅ PASS | Deck created successfully")
        passed += 1
        if "deck" in result:
            deck_id = result["deck"].get("_id")
            print(f"Created deck ID: {deck_id}")
    else:
        print("❌ FAIL | Deck creation failed")
        failed += 1

    # 3. Test get all decks
    total += 1
    print("\nTesting: Get All Decks")
    result = make_request(
        "get", f"{api_url}/api/decks", headers=headers, verbose=verbose
    )
    if result is not None and "decks" in result:
        deck_count = len(result["decks"])
        print(f"✅ PASS | Retrieved {deck_count} decks")
        passed += 1

        # If we didn't get a deck ID from creation, try to get one from the list
        if deck_id is None and deck_count > 0:
            deck_id = result["decks"][0]["_id"]
            print(f"Selected deck ID: {deck_id}")
    else:
        print("❌ FAIL | Failed to retrieve decks")
        failed += 1

    # 4. Test get specific deck (if we have a deck ID)
    if deck_id:
        total += 1
        print(f"\nTesting: Get Specific Deck (ID: {deck_id})")
        result = make_request(
            "get", f"{api_url}/api/decks/{deck_id}", headers=headers, verbose=verbose
        )
        if result is not None and "deck" in result:
            deck_name = result["deck"].get("name", "Unknown")
            print(f"✅ PASS | Retrieved deck: {deck_name}")
            passed += 1
        else:
            print("❌ FAIL | Failed to retrieve specific deck")
            failed += 1

        # 5. Test update deck
        total += 1
        print(f"\nTesting: Update Deck (ID: {deck_id})")
        update_data = {
            "name": "Updated API Test Deck",
            "description": "This deck was updated via API testing",
        }
        result = make_request(
            "put",
            f"{api_url}/api/decks/{deck_id}",
            headers=headers,
            data=update_data,
            verbose=verbose,
        )
        if result is not None:
            print("✅ PASS | Deck updated successfully")
            passed += 1
        else:
            print("❌ FAIL | Failed to update deck")
            failed += 1

        # 6. Test create card
        total += 1
        print(f"\nTesting: Create Card (in Deck ID: {deck_id})")
        card_data = {
            "deckId": deck_id,
            "front": "What is the capital of France?",
            "back": "Paris",
        }
        result = make_request(
            "post",
            f"{api_url}/api/cards",
            headers=headers,
            data=card_data,
            verbose=verbose,
        )
        if result is not None and "card" in result:
            print("✅ PASS | Card created successfully")
            passed += 1
            card_id = result["card"].get("_id")
            print(f"Created card ID: {card_id}")
        else:
            print("❌ FAIL | Failed to create card")
            failed += 1

        # 7. Test get cards in deck
        total += 1
        print(f"\nTesting: Get Cards in Deck (Deck ID: {deck_id})")
        result = make_request(
            "get",
            f"{api_url}/api/cards/deck/{deck_id}",
            headers=headers,
            verbose=verbose,
        )
        if result is not None and "cards" in result:
            card_count = len(result["cards"])
            print(f"✅ PASS | Retrieved {card_count} cards from deck")
            passed += 1
        else:
            print("❌ FAIL | Failed to retrieve cards in deck")
            failed += 1

    # 8. Test get credit balance
    total += 1
    print("\nTesting: Get Credit Balance")
    result = make_request(
        "get", f"{api_url}/api/credits/balance", headers=headers, verbose=verbose
    )
    if result is not None:
        balance = result.get("balance", "Unknown")
        print(f"✅ PASS | Current credit balance: {balance}")
        passed += 1
    else:
        print("❌ FAIL | Failed to retrieve credit balance")
        failed += 1

    # 9. Test get credit packages
    total += 1
    print("\nTesting: Get Credit Packages")
    result = make_request(
        "get", f"{api_url}/api/credits/packages", headers=headers, verbose=verbose
    )
    if result is not None:
        packages = result.get("packages", [])
        print(f"✅ PASS | Retrieved {len(packages)} credit packages")
        passed += 1
    else:
        print("❌ FAIL | Failed to retrieve credit packages")
        failed += 1

    # Print summary
    print(f"\n✅ {passed} tests passed")
    print(f"❌ {failed} tests failed")
    print(f"\nTotal: {total} tests")

    return passed, failed, total


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Test the Flashcard API with a provided token"
    )
    parser.add_argument(
        "--url",
        type=str,
        default="http://localhost:4000",
        help="Base URL of the Flashcard API (default: http://localhost:4000)",
    )
    parser.add_argument(
        "--token", type=str, required=True, help="JWT access token for authentication"
    )
    parser.add_argument("--verbose", action="store_true", help="Enable verbose output")

    args = parser.parse_args()

    test_flashcard_api(args.url, args.token, args.verbose)
