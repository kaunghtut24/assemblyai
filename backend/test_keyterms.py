#!/usr/bin/env python3
"""
Test script to verify keyterms_prompt parsing logic
"""

def test_keyterms_parsing():
    """Test the keyterms parsing logic used in transcriber.py"""
    
    test_cases = [
        # Test case 1: Simple comma-separated terms
        {
            "input": "API, database, authentication, deployment",
            "expected": ["API", "database", "authentication", "deployment"]
        },
        # Test case 2: Terms with extra spaces
        {
            "input": "  medical terms  ,  diagnosis  ,  prescription  ",
            "expected": ["medical terms", "diagnosis", "prescription"]
        },
        # Test case 3: Mixed format with some empty entries
        {
            "input": "term1, , term2,  ,term3",
            "expected": ["term1", "term2", "term3"]
        },
        # Test case 4: Single term
        {
            "input": "single-term",
            "expected": ["single-term"]
        },
        # Test case 5: Empty string
        {
            "input": "",
            "expected": []
        },
        # Test case 6: Real-world example
        {
            "input": "State of Economy Podcast, businessline, Subramani Ra Mancombu, Sanjay Kumar, commodity prices, inflation trends",
            "expected": ["State of Economy Podcast", "businessline", "Subramani Ra Mancombu", "Sanjay Kumar", "commodity prices", "inflation trends"]
        }
    ]
    
    print("Testing keyterms parsing logic...\n")
    
    for i, test_case in enumerate(test_cases, 1):
        keyterms_prompt = test_case["input"]
        expected = test_case["expected"]
        
        # Apply the same logic as in transcriber.py
        keyterms_list = [term.strip() for term in keyterms_prompt.split(',') if term.strip()]
        
        print(f"Test Case {i}:")
        print(f"  Input: '{keyterms_prompt}'")
        print(f"  Expected: {expected}")
        print(f"  Actual: {keyterms_list}")
        print(f"  Result: {'✅ PASS' if keyterms_list == expected else '❌ FAIL'}")
        print()

if __name__ == "__main__":
    test_keyterms_parsing()
