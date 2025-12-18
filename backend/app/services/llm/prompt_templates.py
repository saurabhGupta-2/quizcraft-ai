from typing import Optional

class PromptTemplates:
    """Collection of prompt templates for different tasks."""

    @staticmethod
    def get_bloom_taxonomy_description(level: str) -> str:
        """Get description for Bloom's taxonomy level."""
        descriptions = {
            "remember": "Recall facts, terms, basic concepts (define, list, identify)",
            "understand": "Explain ideas or concepts (describe, explain, summarize)",
            "apply": "Use information in new situations (apply, demonstrate, solve)",
            "analyze": "Draw connections, break down information (analyze, compare, examine)",
            "evaluate": "Justify decisions, make judgments (evaluate, critique, defend)",
            "create": "Produce new work, combine elements (create, design, construct)"
        }
        return descriptions.get(level.lower(), "")

    @staticmethod
    def generate_questions_prompt(
        content: str,
        question_type: str,
        difficulty: str,
        bloom_level: str,
        num_questions: int,
        custom_instructions: Optional[str] = None
    ) -> str:
        """Generate prompt for question generation."""
        bloom_desc = PromptTemplates.get_bloom_taxonomy_description(bloom_level)
        
        prompt = f"""You are an expert educational content creator. Based on the content provided, generate {num_questions} high-quality questions of the type '{question_type}'.

**Content to Analyze:**
---
{content}
---

**Requirements:**
- **Question Type:** {question_type}
- **Difficulty Level:** {difficulty}
- **Bloom's Taxonomy Level:** {bloom_level.capitalize()} ({bloom_desc})
- **Number of Questions:** {num_questions}
"""
        
        json_format = ""
        if question_type == "multiple_choice":
            json_format = """
**JSON Output Format:**
Return a JSON array where each object has the following keys:
- "question_text": The question itself.
- "question_type": "multiple_choice"
- "options": An array of 4 objects, each with "option_text" (string) and "is_correct" (boolean). Exactly one must be correct.
- "correct_answer": The text of the correct option.
- "explanation": A brief, clear explanation for why the answer is correct.
- "difficulty": "{difficulty}"
- "bloom_level": "{bloom_level}"
"""
        elif question_type == "true_false":
            json_format = """
**JSON Output Format:**
Return a JSON array where each object has the following keys:
- "question_text": The statement to be evaluated.
- "question_type": "true_false"
- "correct_answer": "True" or "False".
- "explanation": A brief, clear explanation for why the statement is true or false.
- "difficulty": "{difficulty}"
- "bloom_level": "{bloom_level}"
"""
        elif question_type == "short_answer":
            json_format = """
**JSON Output Format:**
Return a JSON array where each object has the following keys:
- "question_text": The question.
- "question_type": "short_answer"
- "correct_answer": A concise, ideal answer (2-3 sentences).
- "explanation": Details on what a good answer should cover.
- "difficulty": "{difficulty}"
- "bloom_level": "{bloom_level}"
"""
        
        prompt += json_format
        if custom_instructions:
            prompt += f"\n**Custom Instructions:** {custom_instructions}\n"
        
        prompt += "\nEnsure the generated questions are diverse, engaging, and accurately test understanding at the specified Bloom's level based *only* on the provided content."
        return prompt

    @staticmethod
    def generate_flashcards_prompt(content: str, num_cards: int = 10) -> str:
        """Generate prompt for flashcard generation."""
        return f"""From the content below, create {num_cards} educational flashcards covering the most important concepts.

**Content:**
---
{content}
---

**Instructions:**
For each flashcard, provide a "front" (a concise question or key term) and a "back" (a clear, detailed answer or definition).

**JSON Output Format:**
Return a JSON array where each object has two keys: "front" and "back".
Example: `[ {{"front": "What is photosynthesis?", "back": "It's the process plants use..."}} ]`
"""

    @staticmethod
    def generate_study_notes_prompt(content: str) -> str:
        """Generate prompt for study notes generation."""
        return f"""Analyze the following content and create a comprehensive set of study notes in Markdown format.

**Content:**
---
{content}
---

**Instructions:**
Structure the notes logically with clear headings, bullet points, and bolded keywords. The notes should include:
1.  An **Overview/Introduction**.
2.  **Main Concepts** broken down into digestible sections.
3.  A list of **Key Definitions**.
4.  A final **Summary/Key Takeaways** section.

The output should be a single block of well-formatted Markdown text.
"""

    @staticmethod
    def generate_topic_content_prompt(topic: str) -> str:
        """Generate prompt for creating content from a topic."""
        return f"""Generate a comprehensive educational text on the topic of: **{topic}**

The text should be between 500-800 words and suitable for an intermediate learner. Structure it clearly with an introduction, detailed explanations of core concepts, real-world examples, and a concluding summary. This content will be used to generate quizzes and study materials.
"""

    @staticmethod
    def analyze_answer_prompt(
        question: str,
        correct_answer: str,
        student_answer: str
    ) -> str:
        """Generate prompt for answer analysis."""
        return f"""Analyze the student's answer to the question below and provide structured feedback.

**Question:** {question}
**Model Correct Answer:** {correct_answer}
**Student's Answer:** {student_answer}

**JSON Output Format:**
Return a JSON object with the following keys:
- "is_correct": A string ("yes", "no", or "partial").
- "score": An integer score from 0 to 100.
- "feedback": A detailed explanation of what was right, what was wrong, and why.
- "suggestions": Actionable advice for the student to improve their understanding.
"""