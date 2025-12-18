// In JavaScript, we use JSDoc comments to define types for documentation
// and improved editor support, instead of TypeScript interfaces.

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} full_name
 * @property {string} username
 * @property {'learner' | 'educator'} [user_role]
 * @property {string} [role_type]
 * @property {string[]} [interests]
 * @property {string} [grade_level]
 * @property {string[]} [subjects]
 * @property {boolean} is_onboarded
 * @property {string} created_at
 */

/**
 * @typedef {Object} Lesson
 * @property {string} id
 * @property {string} user_id
 * @property {string} title
 * @property {string} [description]
 * @property {string} [folder_id]
 * @property {Question[]} questions
 * @property {Flashcard[]} flashcards
 * @property {string} study_notes
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} lesson_id
 * @property {string} question_text
 * @property {'multiple_choice' | 'true_false' | 'short_answer' | 'fill_in_the_blanks' | 'matching'} question_type
 * @property {'easy' | 'medium' | 'hard' | 'very_hard'} difficulty
 * @property {'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'} bloom_level
 * @property {string} correct_answer
 * @property {string} explanation
 * @property {Array<{option_text: string, is_correct: boolean}>} [options]
 * @property {number} points
 */

/**
 * @typedef {Object} Flashcard
 * @property {string} id
 * @property {string} lesson_id
 * @property {string} front
 * @property {string} back
 * @property {number} [confidence_level]
 */

/**
 * @typedef {Object} Folder
 * @property {string} id
 * @property {string} user_id
 * @property {string} name
 * @property {string} [parent_id]
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} QuizResult
 * @property {number} score
 * @property {number} total_questions
 * @property {number} percentage
 * @property {number} correct_answers
 * @property {number} incorrect_answers
 * @property {number} time_taken
 */

/**
 * @typedef {Object} GenerationRequest
 * @property {'upload' | 'topic' | 'notes'} source_type
 * @property {string} [content]
 * @property {string} [topic]
 * @property {string} [file_id]
 * @property {string} question_type
 * @property {string} difficulty
 * @property {string} [ai_model]
 * @property {number} max_questions
 * @property {string[]} [bloom_levels]
 * @property {string} [custom_instructions]
 */

// This empty export helps ensure the file is treated as a module.
export {};

