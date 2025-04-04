import os
import json
import http.client
import requests
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

def test_erweima_music_generation():
    """Test the Erweima AI music generation API with continuous polling until completion."""
    
    # Get API key from environment
    erweima_api_key = os.getenv("ERWEIMA_API_KEY")
    
    if not erweima_api_key:
        print("❌ ERROR: No Erweima API key found in environment variables.")
        print("Please set the ERWEIMA_API_KEY environment variable.")
        return
    
    print("🎵 Testing Erweima AI music generation...")
    
    # Test parameters
    music_prompt = "A fun children's song about planets in our solar system"
    style = "Children's Music"
    title = "Kid Song: Planets"
    
    # API call to Erweima AI
    url = "https://apibox.erweima.ai/api/v1/generate"
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {erweima_api_key}"
    }
    
    payload = {
        "prompt": music_prompt,
        "style": style,
        "title": title,
        "customMode": True,
        "instrumental": True,  # Generate instrumental track
        "model": "V3_5",
        "callBackUrl": "https://example.com/callback"  # This won't be used in our test
    }
    
    print(f"📤 Sending request to generate music with prompt: '{music_prompt}'")
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Request successful: {json.dumps(result, indent=2)}")
            
            if result["code"] == 200 and "data" in result and "task_id" in result["data"]:
                task_id = result["data"]["task_id"]
                print(f"📋 Task ID: {task_id}")
                
                # Poll for the result until we get a success or hit the timeout
                print("🔍 Checking generation status (this may take several minutes)...")
                
                # Configuration for polling
                max_attempts = 30  # Maximum number of polling attempts
                initial_wait = 10   # Initial wait time in seconds
                max_wait = 300       # Maximum wait time in seconds
                total_wait = 0      # Total time waited so far
                max_total_wait = 15 * 60  # Maximum total wait time (15 minutes)
                
                for attempt in range(1, max_attempts + 1):
                    # Calculate wait time with exponential backoff (capped at max_wait)
                    wait_time = min(initial_wait * (1.5 ** (attempt - 1)), max_wait)
                    total_wait += wait_time
                    
                    # Check if we've exceeded the maximum total wait time
                    if total_wait > max_total_wait:
                        print(f"⏱️ Exceeded maximum wait time of {max_total_wait/60:.1f} minutes.")
                        break
                    
                    print(f"   Attempt {attempt}/{max_attempts} (Total wait: {total_wait/60:.1f} minutes)...")
                    print(f"   Waiting {wait_time:.1f} seconds before checking...")
                    time.sleep(wait_time)
                    
                    # Check the status
                    conn = http.client.HTTPSConnection("apibox.erweima.ai")
                    status_headers = {
                        "Accept": "application/json",
                        "Authorization": f"Bearer {erweima_api_key}"
                    }
                    
                    conn.request("GET", f"/api/v1/generate/record-info?task_id={task_id}", "", status_headers)
                    status_res = conn.getresponse()
                    status_data = status_res.read()
                    status_info = json.loads(status_data.decode("utf-8"))
                    
                    # Print a condensed version of the response to avoid cluttering the output
                    print(f"   Status code: {status_info.get('code')}")
                    if "data" in status_info:
                        if isinstance(status_info["data"], list) and len(status_info["data"]) > 0:
                            print(f"   Data entries: {len(status_info['data'])}")
                        else:
                            print(f"   Data: {status_info['data']}")
                    
                    # Check if music generation is complete
                    if status_info["code"] == 200 and "data" in status_info and status_info["data"]:
                        audio_data = status_info["data"]
                        if isinstance(audio_data, list) and len(audio_data) > 0:
                            if "audio_url" in audio_data[0]:
                                print(f"\n🎉 Music generated successfully after {total_wait/60:.1f} minutes!")
                                print(f"🔊 Audio URL: {audio_data[0]['audio_url']}")
                                
                                # Print additional details if available
                                if "duration" in audio_data[0]:
                                    print(f"⏱️ Duration: {audio_data[0]['duration']} seconds")
                                if "title" in audio_data[0]:
                                    print(f"📝 Title: {audio_data[0]['title']}")
                                
                                return
                
                print("\n⚠️ Maximum polling attempts reached or timeout exceeded.")
                print(f"   The music generation process may still be running in the background.")
                print(f"   You can check the status later using task ID: {task_id}")
                print(f"   Use this command to check: GET /api/v1/generate/record-info?task_id={task_id}")
            else:
                print(f"❌ API returned error: {result.get('msg', 'Unknown error')}")
        else:
            print(f"❌ Request failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
    
    except Exception as e:
        print(f"❌ Error during API call: {str(e)}")

if __name__ == "__main__":
    test_erweima_music_generation() 