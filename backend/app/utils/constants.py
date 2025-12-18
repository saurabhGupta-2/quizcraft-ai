# Question Types
QUESTION_TYPES = [
    "multiple_choice",
    "true_false",
    "short_answer",
    "fill_in_the_blanks",
    "matching",
    "mixed"
]

# Difficulty Levels
DIFFICULTY_LEVELS = [
    "easy",
    "medium",
    "hard",
    "very_hard",
    "mixed"
]

# Bloom's Taxonomy Levels
BLOOM_LEVELS = [
    "remember",
    "understand",
    "apply",
    "analyze",
    "evaluate",
    "create"
]

# User Roles
USER_ROLES = {
    "learner": [
        "high_school_student",
        "university_student",
        "professional_dev",
        "language_learner"
    ],
    "educator": [
        "high_school_teacher",
        "university_professor",
        "parent",
        "corporate_trainer",
        "tutor_instructor"
    ]
}

# File Upload Settings
ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md']
MAX_FILE_SIZE_MB = 10

# Quiz Settings
MIN_QUESTIONS = 5
MAX_QUESTIONS = 40
DEFAULT_QUESTIONS = 10

# Spaced Repetition Quality Ratings
SR_QUALITY_RATINGS = {
    0: "Complete blackout",
    1: "Incorrect response; correct answer seemed unfamiliar",
    2: "Incorrect response; correct answer seemed familiar",
    3: "Correct response, but required significant effort to recall",
    4: "Correct response, after some hesitation",
    5: "Perfect response"
}
