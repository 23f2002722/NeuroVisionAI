import os

from dotenv import load_dotenv
from google import genai

from rag.prompt import build_report_prompt


load_dotenv()


def generate_report(context):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set.")

    client = genai.Client(api_key=api_key)
    prompt = build_report_prompt(context)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        return response.text

    except Exception as error:
        analysis = context.get("analysis", {})

        return (
            "## AI-Assisted Medical Imaging Research Report\n\n"
            "Gemini report generation was temporarily unavailable. "
            "The structured analysis was completed successfully.\n\n"
            "### Analysis\n\n"
            f"{analysis}\n\n"
            "### Report Status\n\n"
            f"LLM generation error: {error}"
        )


if __name__ == "__main__":
    print("Gemini client ready.")