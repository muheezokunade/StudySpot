import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  school: text("school").default("National Open University of Nigeria"),
  programme: text("programme"),
  studyCenter: text("study_center"),
  level: text("level"),
  referralCode: text("referral_code"),
  referredBy: text("referred_by"),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  role: text("role").default("user"),
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isVerified: true,
  createdAt: true,
});

// Documents schema (for uploaded learning materials)
export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // PDF, DOCX, etc.
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  pageCount: integer("page_count"),
  status: text("status").default("processing"), // processing, indexed, failed
  processingError: text("processing_error"),
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  status: true,
  processingError: true,
  createdAt: true,
});

// Document Chunks schema (text chunks for embedding)
export const documentChunks = sqliteTable("document_chunks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentId: integer("document_id").notNull(),
  content: text("content").notNull(),
  pageNumber: integer("page_number"),
  chunkIndex: integer("chunk_index").notNull(),
  embedding: text("embedding"), // vector embedding as string (will be parsed by app)
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const insertDocumentChunkSchema = createInsertSchema(documentChunks).omit({
  id: true,
  embedding: true,
  createdAt: true,
});

// Concepts schema (extracted educational concepts)
export const concepts = sqliteTable("concepts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentId: integer("document_id").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  prerequisites: blob("prerequisites"), // Array of prerequisite concept IDs
  orderIndex: integer("order_index").notNull(), // For ordering concepts in the learning path
  pageSpan: text("page_span"), // e.g., "10-15" for references
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const insertConceptSchema = createInsertSchema(concepts).omit({
  id: true,
  createdAt: true,
});

// Exercises schema (practice questions for concepts)
export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conceptId: integer("concept_id").notNull(),
  question: text("question").notNull(),
  type: text("type").notNull(), // MCQ, short_answer
  options: blob("options"), // For MCQ
  correctAnswer: text("correct_answer").notNull(),
  hint1: text("hint_1"),
  hint2: text("hint_2"),
  solution: text("solution").notNull(),
  memoryHook: text("memory_hook"), // Mnemonic or analogy
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
});

// Spaced Repetition Stats schema (for scheduling concept reviews)
export const spacedRepetitionStats = sqliteTable("spaced_repetition_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  conceptId: integer("concept_id").notNull(),
  easeFactor: integer("ease_factor").default(250), // SuperMemo2 algorithm values
  interval: integer("interval").default(1), // Days
  nextReviewDate: text("next_review_date").notNull(),
  attempts: integer("attempts").default(0),
  correctAttempts: integer("correct_attempts").default(0),
  lastReviewedAt: text("last_reviewed_at").default(new Date().toISOString()),
});

export const insertSpacedRepetitionStatsSchema = createInsertSchema(spacedRepetitionStats).omit({
  id: true,
  easeFactor: true,
  interval: true,
  attempts: true,
  correctAttempts: true,
  lastReviewedAt: true,
});

// Courses schema
export const courses = sqliteTable("courses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  level: text("level"),
  faculty: text("faculty"),
  semester: text("semester"),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});

// Course Enrollments schema
export const courseEnrollments = sqliteTable("course_enrollments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  enrolledAt: text("enrolled_at").default(new Date().toISOString()),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});

export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments).omit({
  id: true,
  enrolledAt: true,
});

// Course Materials schema
export const courseMaterials = sqliteTable("course_materials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(), // PDF, Video, Quiz
  content: text("content"),
  fileUrl: text("file_url"),
  duration: text("duration"),
  pages: integer("pages"),
  questions: integer("questions"),
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const insertCourseMaterialSchema = createInsertSchema(courseMaterials).omit({
  id: true,
  createdAt: true,
});

// Exams schema
export const exams = sqliteTable("exams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // E-Exam, Pen-on-Paper
  date: text("date"),
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
  createdAt: true,
});

// User Exam Timetable schema
export const examTimetable = sqliteTable("exam_timetable", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  examDate: text("exam_date").notNull(),
  location: text("location"),
  notes: text("notes"),
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const insertExamTimetableSchema = createInsertSchema(examTimetable).omit({
  id: true,
  createdAt: true,
});

// Questions schema
export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("course_id").notNull(),
  content: text("content").notNull(),
  options: blob("options"),
  correctAnswer: text("correct_answer"),
  explanation: text("explanation"),
  type: text("type"), // Multiple Choice, True/False, etc.
  difficulty: text("difficulty"), // Easy, Medium, Hard
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

// User Progress schema
export const userProgress = sqliteTable("user_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  materialId: integer("material_id"),
  examId: integer("exam_id"),
  score: integer("score"),
  completed: integer("completed", { mode: "boolean" }).default(false),
  timestamp: text("timestamp").default(new Date().toISOString()),
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  timestamp: true,
});

// Jobs schema
export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  type: text("type"), // Remote, Hybrid, Full-time, Part-time
  description: text("description"),
  requirements: text("requirements"),
  applicationUrl: text("application_url"),
  postedAt: text("posted_at").default(new Date().toISOString()),
  faculty: text("faculty"), // For faculty-specific jobs
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  postedAt: true,
});

// Forum Posts schema
export const forumPosts = sqliteTable("forum_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  tags: text("tags"), // Store as JSON string and parse in application code
  views: integer("views").default(0),
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const insertForumPostSchema = createInsertSchema(forumPosts).omit({
  id: true,
  views: true,
  createdAt: true,
});

// Forum Replies schema
export const forumReplies = sqliteTable("forum_replies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const insertForumReplySchema = createInsertSchema(forumReplies).omit({
  id: true,
  createdAt: true,
});

// AI Chat Messages schema
export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  isUserMessage: integer("is_user_message", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// User Daily Chat Usage
export const chatUsage = sqliteTable("chat_usage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  date: text("date").default(new Date().toISOString()),
  promptsUsed: integer("prompts_used").default(0),
});

export const insertChatUsageSchema = createInsertSchema(chatUsage).omit({
  id: true,
  date: true,
});

// Subscriptions
export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  tier: text("tier").notNull(), // Free, Premium
  startDate: text("start_date").default(new Date().toISOString()),
  endDate: text("end_date"),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  startDate: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;

export type ExamTimetable = typeof examTimetable.$inferSelect;
export type InsertExamTimetable = z.infer<typeof insertExamTimetableSchema>;

export type CourseMaterial = typeof courseMaterials.$inferSelect;
export type InsertCourseMaterial = z.infer<typeof insertCourseMaterialSchema>;

export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;

export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ChatUsage = typeof chatUsage.$inferSelect;
export type InsertChatUsage = z.infer<typeof insertChatUsageSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

// Types for new schemas
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type InsertDocumentChunk = z.infer<typeof insertDocumentChunkSchema>;

export type Concept = typeof concepts.$inferSelect;
export type InsertConcept = z.infer<typeof insertConceptSchema>;

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

export type SpacedRepetitionStat = typeof spacedRepetitionStats.$inferSelect;
export type InsertSpacedRepetitionStat = z.infer<typeof insertSpacedRepetitionStatsSchema>;

// Fix for the missing notifications table
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  relatedId: integer("related_id"),
  createdAt: text("created_at").default(new Date().toISOString()),
});
