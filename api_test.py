import requests
import json
import time
from typing import Dict, Any, Optional, List
import argparse


class FlashcardAPITester:
    """
    A comprehensive testing tool for the Flashcard Web Application API.
    This script tests all major endpoints including decks, cards, and the credit system.
    Authentication is handled through the external auth service.
    """

    def __init__(self, base_url: str, auth_url: str = None, verbose: bool = False):
        """Initialize with the base URL of the API server and auth service"""
        self.base_url = base_url.rstrip("/")
        self.auth_url = auth_url.rstrip("/") if auth_url else self.base_url
        self.verbose = verbose
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.deck_id = None
        self.card_id = None
        self.package_id = None

    def log(self, message: str):
        """Print log messages if verbose mode is enabled"""
        if self.verbose:
            print(f"[LOG] {message}")

    def print_result(self, endpoint: str, success: bool, details: str = None):
        """Print the test result with formatting"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {endpoint} | {details if details else ''}")

    def make_request(
        self,
        method: str,
        endpoint: str,
        data: Dict[str, Any] = None,
        auth_required: bool = True,
        use_auth_url: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """Make a request to the API with proper headers and error handling"""
        base = self.auth_url if use_auth_url else self.base_url
        url = f"{base}{endpoint}"
        headers = {"Content-Type": "application/json"}

        if auth_required and self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"

        self.log(f"Making {method} request to {url}")
        if data:
            self.log(f"With data: {json.dumps(data, indent=2)}")

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
                self.log(f"Unsupported method: {method}")
                return None

            self.log(f"Response status: {response.status_code}")

            if response.status_code >= 200 and response.status_code < 300:
                if response.text:
                    try:
                        result = response.json()
                        self.log(f"Response data: {json.dumps(result, indent=2)}")
                        return result
                    except json.JSONDecodeError:
                        self.log(f"Response is not JSON: {response.text}")
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
                self.log(f"Request failed: {error_msg}")
                return None

        except Exception as e:
            self.log(f"Exception occurred: {str(e)}")
            return None

    # === Authentication Endpoints ===

    def test_signup(self, email: str, password: str, name: str) -> bool:
        """Test user registration through the auth service"""
        # Try different endpoint formats based on documentation
        endpoints = [
            "/api/auth/signup",  # Standard endpoint
            "/auth/register",  # Alternative endpoint from docs
            "/auth/signup",  # Another possible format
        ]

        data = {"email": email, "password": password, "name": name}

        # Also try with username instead of name
        alt_data = {"email": email, "password": password, "username": name}

        for endpoint in endpoints:
            self.log(f"Trying registration endpoint: {endpoint}")
            result = self.make_request(
                "post", endpoint, data, auth_required=False, use_auth_url=True
            )
            if result is not None:
                self.print_result(endpoint, True, "User registration successful")
                return True

            # Try alternate data format
            self.log(f"Trying alternate data format with username instead of name")
            result = self.make_request(
                "post", endpoint, alt_data, auth_required=False, use_auth_url=True
            )
            if result is not None:
                self.print_result(endpoint, True, "User registration successful")
                return True

        self.print_result(
            "Registration", False, "Failed to register user with any endpoint"
        )
        return False

    def test_login(self, email: str, password: str) -> bool:
        """Test user login and token retrieval through the auth service"""
        # Try different endpoint formats based on documentation
        endpoints = [
            "/api/auth/login",  # Standard endpoint
            "/auth/login",  # Alternative endpoint from docs
        ]

        # Try different data formats
        data_formats = [
            {"email": email, "password": password},
            {"username": email, "password": password},
        ]

        for endpoint in endpoints:
            for data in data_formats:
                self.log(
                    f"Trying login endpoint: {endpoint} with data format: {data.keys()}"
                )
                result = self.make_request(
                    "post", endpoint, data, auth_required=False, use_auth_url=True
                )

                if result is not None:
                    # Check for different token formats in the response
                    if "token" in result:
                        self.access_token = result.get("token")
                        self.refresh_token = result.get("refreshToken")
                        self.user_id = result.get("userId") or result.get(
                            "user", {}
                        ).get("_id")
                        self.print_result(
                            endpoint,
                            True,
                            f"Login successful for {email} (token format)",
                        )
                        return True
                    elif "accessToken" in result:
                        self.access_token = result.get("accessToken")
                        self.refresh_token = result.get("refreshToken")
                        self.user_id = result.get("userId") or result.get(
                            "user", {}
                        ).get("_id")
                        self.print_result(
                            endpoint,
                            True,
                            f"Login successful for {email} (accessToken format)",
                        )
                        return True

        self.print_result("Login", False, "Login failed with all endpoint combinations")
        return False

    # === Health Check Endpoint ===

    def test_health_check(self) -> bool:
        """Test the health check endpoint of the flashcard API server"""
        endpoint = "/health"

        result = self.make_request("get", endpoint, auth_required=False)
        success = result is not None

        if success:
            self.print_result(
                endpoint, True, "Flashcard API server health check passed"
            )
        else:
            self.print_result(
                endpoint, False, "Flashcard API server health check failed"
            )

        return success

    def test_auth_health_check(self) -> bool:
        """Test the health check endpoint of the auth service"""
        endpoint = "/health"

        result = self.make_request(
            "get", endpoint, auth_required=False, use_auth_url=True
        )
        success = result is not None

        if success:
            self.print_result(endpoint, True, "Auth service health check passed")
        else:
            self.print_result(endpoint, False, "Auth service health check failed")

        return success

    # === Deck Endpoints ===

    def test_create_deck(
        self, name: str, description: str = "", is_public: bool = False
    ) -> bool:
        """Test creating a new deck"""
        endpoint = "/api/decks"
        data = {"name": name, "description": description, "isPublic": is_public}

        result = self.make_request("post", endpoint, data)
        success = result is not None and ("deck" in result or "message" in result)

        if success:
            if "deck" in result:
                self.deck_id = result["deck"].get("_id")
            self.print_result(endpoint, True, f"Created deck: {name}")
        else:
            self.print_result(endpoint, False, "Failed to create deck")

        return success

    def test_get_user_decks(self) -> bool:
        """Test fetching all decks for the current user"""
        endpoint = "/api/decks"

        result = self.make_request("get", endpoint)
        success = result is not None

        if success:
            deck_count = len(result.get("decks", []))
            self.print_result(endpoint, True, f"Retrieved {deck_count} decks")
        else:
            self.print_result(endpoint, False, "Failed to retrieve decks")

        return success

    def test_get_deck(self, deck_id: str = None) -> bool:
        """Test fetching a specific deck"""
        deck_id = deck_id or self.deck_id
        if not deck_id:
            self.print_result("/api/decks/:id", False, "No deck ID available")
            return False

        endpoint = f"/api/decks/{deck_id}"

        result = self.make_request("get", endpoint)
        success = result is not None

        if success:
            deck_name = result.get("deck", {}).get("name", "Unknown")
            self.print_result(endpoint, True, f"Retrieved deck: {deck_name}")
        else:
            self.print_result(endpoint, False, f"Failed to retrieve deck {deck_id}")

        return success

    def test_update_deck(
        self, deck_id: str = None, name: str = None, description: str = None
    ) -> bool:
        """Test updating a deck"""
        deck_id = deck_id or self.deck_id
        if not deck_id:
            self.print_result("/api/decks/:id", False, "No deck ID available")
            return False

        endpoint = f"/api/decks/{deck_id}"
        data = {}

        if name:
            data["name"] = name
        if description is not None:
            data["description"] = description

        result = self.make_request("put", endpoint, data)
        success = result is not None

        if success:
            self.print_result(endpoint, True, f"Updated deck {deck_id}")
        else:
            self.print_result(endpoint, False, f"Failed to update deck {deck_id}")

        return success

    # === Card Endpoints ===

    def test_create_card(
        self, deck_id: str = None, front: str = "Front text", back: str = "Back text"
    ) -> bool:
        """Test creating a new flashcard"""
        deck_id = deck_id or self.deck_id
        if not deck_id:
            self.print_result("/api/cards", False, "No deck ID available")
            return False

        endpoint = "/api/cards"
        data = {"deckId": deck_id, "front": front, "back": back}

        result = self.make_request("post", endpoint, data)
        success = result is not None

        if success:
            if "card" in result:
                self.card_id = result["card"].get("_id")
            self.print_result(endpoint, True, f"Created card in deck {deck_id}")
        else:
            self.print_result(endpoint, False, "Failed to create card")

        return success

    def test_get_deck_cards(self, deck_id: str = None) -> bool:
        """Test fetching all cards for a specific deck"""
        deck_id = deck_id or self.deck_id
        if not deck_id:
            self.print_result("/api/cards/deck/:deckId", False, "No deck ID available")
            return False

        endpoint = f"/api/cards/deck/{deck_id}"

        result = self.make_request("get", endpoint)
        success = result is not None

        if success:
            card_count = len(result.get("cards", []))
            self.print_result(
                endpoint, True, f"Retrieved {card_count} cards from deck {deck_id}"
            )
        else:
            self.print_result(
                endpoint, False, f"Failed to retrieve cards for deck {deck_id}"
            )

        return success

    # === Credit System Endpoints ===

    def test_get_credit_balance(self) -> bool:
        """Test fetching the user's credit balance"""
        endpoint = "/api/credits/balance"

        result = self.make_request("get", endpoint)
        success = result is not None

        if success:
            balance = result.get("balance", "Unknown")
            self.print_result(endpoint, True, f"Current credit balance: {balance}")
        else:
            self.print_result(endpoint, False, "Failed to retrieve credit balance")

        return success

    def test_get_credit_packages(self) -> bool:
        """Test fetching available credit packages"""
        endpoint = "/api/credits/packages"

        result = self.make_request("get", endpoint)
        success = result is not None

        if success:
            packages = result.get("packages", [])
            if packages and len(packages) > 0:
                self.package_id = packages[0].get("_id")
            self.print_result(
                endpoint, True, f"Retrieved {len(packages)} credit packages"
            )
        else:
            self.print_result(endpoint, False, "Failed to retrieve credit packages")

        return success

    # === Run All Tests ===

    def run_all_tests(self, email: str, password: str, name: str) -> None:
        """Run all API tests in sequence"""
        print("\n🔍 FLASHCARD API TEST SUITE 🔍\n")
        print(f"Testing API: {self.base_url}")
        if self.auth_url != self.base_url:
            print(f"Auth Service: {self.auth_url}\n")
        else:
            print()

        # Define test sequence
        test_sequence = [
            # Health checks
            {
                "test": lambda: self.test_health_check(),
                "skip_condition": lambda: False,
                "name": "Flashcard API Health Check",
            },
            {
                "test": lambda: self.test_auth_health_check(),
                "skip_condition": lambda: False,
                "name": "Auth Service Health Check",
            },
            # Auth tests
            {
                "test": lambda: self.test_signup(email, password, name),
                "skip_condition": lambda: False,
                "name": "User Registration",
            },
            {
                "test": lambda: self.test_login(email, password),
                "skip_condition": lambda: False,
                "name": "User Login",
            },
            # Deck tests
            {
                "test": lambda: self.test_create_deck(
                    "Test Deck", "Test description", False
                ),
                "skip_condition": lambda: not self.access_token,
                "name": "Create Deck",
            },
            {
                "test": lambda: self.test_get_user_decks(),
                "skip_condition": lambda: not self.access_token,
                "name": "Get User Decks",
            },
            {
                "test": lambda: self.test_get_deck(),
                "skip_condition": lambda: not self.deck_id,
                "name": "Get Deck Details",
            },
            {
                "test": lambda: self.test_update_deck(name="Updated Test Deck"),
                "skip_condition": lambda: not self.deck_id,
                "name": "Update Deck",
            },
            # Card tests
            {
                "test": lambda: self.test_create_card(
                    front="Test Question", back="Test Answer"
                ),
                "skip_condition": lambda: not self.deck_id,
                "name": "Create Card",
            },
            {
                "test": lambda: self.test_get_deck_cards(),
                "skip_condition": lambda: not self.deck_id,
                "name": "Get Deck Cards",
            },
            # Credit tests
            {
                "test": lambda: self.test_get_credit_balance(),
                "skip_condition": lambda: not self.access_token,
                "name": "Get Credit Balance",
            },
            {
                "test": lambda: self.test_get_credit_packages(),
                "skip_condition": lambda: not self.access_token,
                "name": "Get Credit Packages",
            },
        ]

        # Run tests
        skipped = 0
        passed = 0
        failed = 0

        for test_item in test_sequence:
            print(f"\nRunning test: {test_item.get('name', 'Unknown Test')}")
            if test_item["skip_condition"]():
                print(f"⏩ Skipping test: {test_item.get('name', 'Unknown Test')}")
                skipped += 1
                continue

            if test_item["test"]():
                passed += 1
            else:
                failed += 1

            # Small delay between tests to avoid overwhelming the server
            time.sleep(0.5)

        # Print summary
        print(f"\n✅ {passed} tests passed")
        print(f"❌ {failed} tests failed")
        print(f"⏩ {skipped} tests skipped")
        print(f"\nTotal: {passed + failed + skipped} tests\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test the Flashcard API")
    parser.add_argument(
        "--url",
        type=str,
        default="http://localhost:4000",
        help="Base URL of the Flashcard API (default: http://localhost:4000)",
    )
    parser.add_argument(
        "--auth-url",
        type=str,
        default="http://localhost:3000",
        help="Base URL of the Auth Service (default: http://localhost:3000)",
    )
    parser.add_argument(
        "--email",
        type=str,
        default="test@example.com",
        help="Email for testing (default: test@example.com)",
    )
    parser.add_argument(
        "--password",
        type=str,
        default="Password123!",
        help="Password for testing (default: Password123!)",
    )
    parser.add_argument(
        "--name",
        type=str,
        default="Test User",
        help="User name for testing (default: Test User)",
    )
    parser.add_argument("--verbose", action="store_true", help="Enable verbose output")

    args = parser.parse_args()

    tester = FlashcardAPITester(args.url, args.auth_url, args.verbose)
    tester.run_all_tests(args.email, args.password, args.name)
