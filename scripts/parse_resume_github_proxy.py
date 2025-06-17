import os
import sys
from openai import OpenAI

# Check CLI arguments
if len(sys.argv) != 3:
  print("Usage: python3 parse_resume_github_proxy.py <input_txt_file> <output_json_file>")
  sys.exit(1)

input_txt = sys.argv[1]
output_json = sys.argv[2]

# Load token
token = os.environ.get("GITHUB_TOKEN")
if not token:
  raise EnvironmentError("GITHUB_TOKEN not set")

# Set up OpenAI client via GitHub endpoint
client = OpenAI(
  base_url="https://models.github.ai/inference",
  api_key=token,
)

# Read resume text
with open(input_txt, "r", encoding="utf-8") as f:
  resume_text = f.read()

# Build the parsing prompt
prompt = f"""
Extract the following structured information from the resume text below. Return your response as valid JSON only, matching this structure:

- contact: includes
  - fullName (string)
  - primaryEmail (string)
  - emails (array of strings)
  - primaryPhone (string)
  - phones (array of strings)
- objectives: career objective as a string
- skills: list of unique skills (no duplicates)
- jobs: list of jobs, each with:
  - title
  - company
  - description (summary of role)
  - startDate (e.g., "Jan 2020")
  - endDate (e.g., "Dec 2021" or "Present")
  - accomplishments (array of strings)
- education: list of education records, each with:
  - institution
  - degree
  - dates (e.g., "2018 - 2022")
  - gpa (optional)
  - certificate (optional)

Resume:
{resume_text}

Respond with raw JSON only. Do NOT include any markdown formatting, triple backticks, or explanations.
"""

try:
  response = client.chat.completions.create(
    messages=[
      {"role": "system", "content": "You are an expert resume parser."},
      {"role": "user", "content": prompt}
    ],
    temperature=0.2,
    max_tokens=1500,
    model="openai/gpt-4o-mini"
  )

  structured_output = response.choices[0].message.content.strip()

  # Save the result to output file
  os.makedirs(os.path.dirname(output_json), exist_ok=True)
  with open(output_json, "w", encoding="utf-8") as out_f:
    out_f.write(structured_output)

  print(f"✅ Parsed JSON saved to {output_json}")

except Exception as e:
  print("❌ Parsing failed:", e)
  sys.exit(1)
