import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateAIResponse, generateCourseSummary, generateQuizQuestions } from "./openai";
import bcrypt from 'bcryptjs';
import session from 'express-session';
import MemoryStore from 'memorystore';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import tutorRoutes from './tutorRoutes';

// Fix for ES modules (no __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  console.log('Creating uploads directory at:', uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });
}

// User-defined type guard for checking if the user is logged in
function isAuthenticated(req: Request): boolean {
  return req.session && req.session.user !== undefined;
}

// Set up multer for file uploads
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.txt', '.pdf', '.doc', '.docx'];
    
    if (allowedExts.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only ${allowedExts.join(', ')} files are allowed.`));
    }
  }
});

// Ultra-simple file upload handler that doesn't depend on pdf-parse
const uploadSimple = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  const MemoryStoreSession = MemoryStore(session);
  
  app.use(session({
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || 'noun-success-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === "production", 
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  
  // Authentication routes
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    try {
      const { firstName, email, password, confirmPassword, school, referralCode } = req.body;
      
      // Validate input
      if (!firstName || !email || !password) {
        return res.status(400).json({ message: 'First name, email and password are required' });
      }
      
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }
      
      // Check if this is the first user and make them admin
      const allUsers = await storage.getAllUsers();
      const isFirstUser = allUsers.length === 0;

      const newUser = await storage.createUser({
        firstName,
        email,
        password,
        school: school || 'National Open University of Nigeria',
        referralCode,
        role: isFirstUser ? 'admin' : 'user'
      });
      
      // Create free tier subscription
      await storage.createSubscription({
        userId: newUser.id,
        tier: 'Free'
      });
      
      // Set session
      const userWithoutPassword = {
        id: newUser.id,
        firstName: newUser.firstName,
        email: newUser.email,
        school: newUser.school,
        role: newUser.role
      };
      
      req.session.user = userWithoutPassword;
      
      return res.status(201).json({ 
        message: 'User created successfully', 
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Signup error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Set session
      const userWithoutPassword = {
        id: user.id,
        firstName: user.firstName,
        email: user.email,
        school: user.school,
        role: user.role
      };
      
      req.session.user = userWithoutPassword;
      
      return res.status(200).json({ 
        message: 'Login successful', 
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logged out successfully' });
    });
  });
  
  app.get('/api/auth/me', (req: Request, res: Response) => {
    if (isAuthenticated(req)) {
      return res.status(200).json({ user: req.session.user });
    }
    return res.status(401).json({ message: 'Not authenticated' });
  });
  
  // User profile routes
  app.get('/api/user/profile', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get subscription info
      const subscription = await storage.getUserSubscription(userId);
      
      const userProfile = {
        id: user.id,
        firstName: user.firstName,
        email: user.email,
        school: user.school,
        programme: user.programme,
        studyCenter: user.studyCenter,
        level: user.level,
        referralCode: user.referralCode,
        subscription: subscription ? subscription.tier : 'Free'
      };
      
      return res.status(200).json({ profile: userProfile });
    } catch (error) {
      console.error('Profile error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.put('/api/user/profile', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const { firstName, programme, studyCenter, level } = req.body;
      
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        programme,
        studyCenter,
        level
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update session
      if (req.session.user) {
        req.session.user.firstName = updatedUser.firstName;
      }
      
      return res.status(200).json({ 
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          email: updatedUser.email,
          programme: updatedUser.programme,
          studyCenter: updatedUser.studyCenter,
          level: updatedUser.level
        }
      });
    } catch (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Course routes
  app.get('/api/courses', async (req: Request, res: Response) => {
    try {
      const courses = await storage.getCourses();
      return res.status(200).json({ courses });
    } catch (error) {
      console.error('Courses error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/courses/:id', async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Get related materials
      const materials = await storage.getCourseMaterials(courseId);
      
      // Get related exams
      const exams = await storage.getExams(courseId);
      
      return res.status(200).json({ 
        course,
        materials,
        exams
      });
    } catch (error) {
      console.error('Course details error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Course materials routes
  app.get('/api/materials', async (req: Request, res: Response) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      const type = req.query.type as string | undefined;
      
      const materials = await storage.getCourseMaterials(courseId);
      
      return res.status(200).json({ materials });
    } catch (error) {
      console.error('Materials error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/materials', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const { title, courseId, type, description, content, fileUrl } = req.body;
      
      if (!title || !courseId) {
        return res.status(400).json({ message: 'Title and courseId are required' });
      }
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      const newMaterial = await storage.createMaterial({
        title,
        courseId,
        type: type || 'Note',
        description,
        content,
        fileUrl
      });
      
      return res.status(201).json({ 
        message: 'Material created successfully',
        material: newMaterial
      });
    } catch (error) {
      console.error('Material creation error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Exam routes
  app.get('/api/exams', async (req: Request, res: Response) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      const exams = await storage.getExams(courseId);
      
      // Sort by date (nearest first)
      exams.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      return res.status(200).json({ exams });
    } catch (error) {
      console.error('Exams error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/exams/:id/questions', async (req: Request, res: Response) => {
    try {
      const examId = parseInt(req.params.id);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }
      
      // Get questions for the course
      const questions = await storage.getQuestions(exam.courseId);
      
      // If no questions in DB, generate some with AI for demo purposes
      if (questions.length === 0) {
        const course = await storage.getCourse(exam.courseId);
        if (course) {
          const quizData = await generateQuizQuestions(course.code, course.title, 5);
          
          // Convert the generated questions to our format and save them
          const savedQuestions = [];
          for (const q of quizData.questions || []) {
            const newQuestion = await storage.createQuestion({
              courseId: exam.courseId,
              content: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              type: 'Multiple Choice',
              difficulty: 'Medium'
            });
            savedQuestions.push(newQuestion);
          }
          
          return res.status(200).json({ questions: savedQuestions });
        }
      }
      
      return res.status(200).json({ questions });
    } catch (error) {
      console.error('Exam questions error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // User progress routes
  app.get('/api/progress', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const progress = await storage.getUserProgress(userId);
      
      // Get course details for each progress entry
      const enrichedProgress = await Promise.all(
        progress.map(async (item) => {
          const course = await storage.getCourse(item.courseId);
          let material = null;
          if (item.materialId) {
            material = await storage.getCourseMaterial(item.materialId);
          }
          
          return {
            ...item,
            course,
            material
          };
        })
      );
      
      return res.status(200).json({ progress: enrichedProgress });
    } catch (error) {
      console.error('Progress error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/progress', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const { courseId, materialId, completed, score } = req.body;
      
      if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required' });
      }
      
      // Check if user is enrolled in the course
      const isEnrolled = await storage.isUserEnrolledInCourse(userId, courseId);
      if (!isEnrolled) {
        return res.status(403).json({ message: 'You must be enrolled in this course to track progress' });
      }
      
      // Create or update progress
      const progress = await storage.createUserProgress({
        userId,
        courseId,
        materialId,
        completed: completed || false,
        score
      });
      
      return res.status(201).json({
        message: 'Progress updated successfully',
        progress
      });
    } catch (error) {
      console.error('Progress update error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Job routes
  app.get('/api/jobs', async (req: Request, res: Response) => {
    try {
      const location = req.query.location as string | undefined;
      const type = req.query.type as string | undefined;
      const faculty = req.query.faculty as string | undefined;
      
      const jobs = await storage.getJobs({ location, type, faculty });
      
      // Sort by posted date (newest first)
      jobs.sort((a, b) => {
        const dateA = a.postedAt ? new Date(a.postedAt) : new Date(0);
        const dateB = b.postedAt ? new Date(b.postedAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      return res.status(200).json({ jobs });
    } catch (error) {
      console.error('Jobs error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/admin/jobs', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    try {
      const { title, company, location, type, faculty, description, requirements, applicationUrl } = req.body;
      
      // Validate required fields
      if (!title || !company) {
        return res.status(400).json({ message: 'Title and company are required fields' });
      }
      
      // Create the job
      const newJob = await storage.createJob({
        title,
        company,
        location,
        type,
        faculty,
        description,
        requirements,
        applicationUrl
      });
      
      return res.status(201).json({ 
        message: 'Job created successfully',
        job: newJob
      });
    } catch (error) {
      console.error('Job creation error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/jobs/:id', async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      return res.status(200).json({ job });
    } catch (error) {
      console.error('Job details error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Forum routes
  app.get('/api/forum/posts', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      let posts = await storage.getForumPosts(category);
      
      // Sort by created date (newest first)
      posts.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Get reply counts for each post
      const enrichedPosts = await Promise.all(
        posts.map(async (post) => {
          const replies = await storage.getForumReplies(post.id);
          const author = await storage.getUser(post.userId);
          
          return {
            ...post,
            replyCount: replies.length,
            author: author ? { 
              id: author.id, 
              firstName: author.firstName 
            } : null
          };
        })
      );
      
      return res.status(200).json({ posts: enrichedPosts });
    } catch (error) {
      console.error('Forum posts error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/forum/posts/:id', async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getForumPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Increment view count
      await storage.incrementPostViews(postId);
      
      // Get post author
      const author = await storage.getUser(post.userId);
      
      // Get replies with authors
      const replies = await storage.getForumReplies(postId);
      const enrichedReplies = await Promise.all(
        replies.map(async (reply) => {
          const replyAuthor = await storage.getUser(reply.userId);
          
          return {
            ...reply,
            author: replyAuthor ? { 
              id: replyAuthor.id, 
              firstName: replyAuthor.firstName 
            } : null
          };
        })
      );
      
      // Sort replies by date (oldest first)
      enrichedReplies.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateA.getTime() - dateB.getTime();
      });
      
      return res.status(200).json({ 
        post: {
          ...post,
          author: author ? { 
            id: author.id, 
            firstName: author.firstName 
          } : null
        },
        replies: enrichedReplies
      });
    } catch (error) {
      console.error('Forum post details error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/forum/posts', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const { title, content, category, tags } = req.body;
      
      if (!title || !content || !category) {
        return res.status(400).json({ message: 'Title, content, and category are required' });
      }
      
      const newPost = await storage.createForumPost({
        userId,
        title,
        content,
        category,
        tags: tags || []
      });
      
      const author = await storage.getUser(userId);
      
      return res.status(201).json({ 
        message: 'Post created successfully',
        post: {
          ...newPost,
          author: author ? { 
            id: author.id, 
            firstName: author.firstName 
          } : null,
          replyCount: 0
        }
      });
    } catch (error) {
      console.error('Create forum post error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/forum/posts/:id/replies', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const postId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: 'Content is required' });
      }
      
      // Check if post exists
      const post = await storage.getForumPost(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      const newReply = await storage.createForumReply({
        postId,
        userId,
        content
      });
      
      const author = await storage.getUser(userId);
      
      return res.status(201).json({ 
        message: 'Reply created successfully',
        reply: {
          ...newReply,
          author: author ? { 
            id: author.id, 
            firstName: author.firstName 
          } : null
        }
      });
    } catch (error) {
      console.error('Create forum reply error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // AI Chat routes
  app.post('/api/chat', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }
      
      // Generate AI response
      const aiResponse = await generateAIResponse(prompt);
      
      // Return the response
      return res.status(200).json({ 
        response: aiResponse,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('AI chat error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/chat/history', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      
      // For now, return an empty history as the core functionality
      return res.status(200).json({ 
        messages: [],
        promptsUsed: 0,
        promptLimit: null
      });
    } catch (error) {
      console.error('Chat history error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Summary generator routes
  app.post('/api/summary', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const { courseCode, topic } = req.body;
      
      if (!courseCode || !topic) {
        return res.status(400).json({ message: 'Course code and topic are required' });
      }
      
      const summary = await generateCourseSummary(courseCode, topic);
      
      return res.status(200).json({ summary });
    } catch (error) {
      console.error('Summary generation error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/quiz', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const { courseCode, topic, count } = req.body;
      
      if (!courseCode || !topic) {
        return res.status(400).json({ message: 'Course code and topic are required' });
      }
      
      const quizData = await generateQuizQuestions(courseCode, topic, count || 5);
      
      return res.status(200).json(quizData);
    } catch (error) {
      console.error('Quiz generation error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Add admin routes
  app.post('/api/admin/make-admin', async (req: Request, res: Response) => {
    if (!isAuthenticated(req) || req.session.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const updatedUser = await storage.updateUser(userId, { role: 'admin' });
      
      return res.status(200).json({ 
        message: 'User promoted to admin successfully',
        user: {
          id: updatedUser!.id,
          firstName: updatedUser!.firstName,
          email: updatedUser!.email,
          role: updatedUser!.role
        }
      });
    } catch (error) {
      console.error('Make admin error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin user management
  app.get('/api/admin/users', async (req: Request, res: Response) => {
    if (!isAuthenticated(req) || req.session.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    try {
      const allUsers = await storage.getAllUsers();
      
      const users = allUsers.map(user => ({
        id: user.id,
        firstName: user.firstName,
        email: user.email,
        school: user.school,
        studyCenter: user.studyCenter,
        level: user.level,
        role: user.role,
        status: user.isVerified ? 'active' : 'inactive',
        createdAt: user.createdAt
      }));
      
      return res.status(200).json({ users });
    } catch (error) {
      console.error('Admin users error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin course management
  app.get('/api/admin/courses', async (req: Request, res: Response) => {
    if (!isAuthenticated(req) || req.session.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    try {
      const courses = await storage.getCourses();
      return res.status(200).json({ courses });
    } catch (error) {
      console.error('Admin courses error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Course enrollment routes
  app.get('/api/enrollments', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const enrollments = await storage.getUserEnrollments(userId);
      
      // Get course details for each enrollment
      const enrolledCourses = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          return {
            ...enrollment,
            course
          };
        })
      );
      
      return res.status(200).json({ enrollments: enrolledCourses });
    } catch (error) {
      console.error('Enrollments error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/enrollments', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const { courseId } = req.body;
      
      if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required' });
      }
      
      // Check if user is already enrolled
      const isEnrolled = await storage.isUserEnrolledInCourse(userId, courseId);
      if (isEnrolled) {
        return res.status(409).json({ message: 'User is already enrolled in this course' });
      }
      
      // Enroll the user
      const enrollment = await storage.enrollUserInCourse({
        userId,
        courseId,
        isActive: true
      });
      
      // Get course details
      const course = await storage.getCourse(courseId);
      
      return res.status(201).json({
        message: 'Enrolled successfully',
        enrollment: {
          ...enrollment,
          course
        }
      });
    } catch (error) {
      console.error('Enrollment error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.delete('/api/enrollments/:courseId', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const courseId = parseInt(req.params.courseId);
      
      // Check if user is enrolled
      const isEnrolled = await storage.isUserEnrolledInCourse(userId, courseId);
      if (!isEnrolled) {
        return res.status(404).json({ message: 'User is not enrolled in this course' });
      }
      
      // Unenroll the user
      await storage.unenrollUserFromCourse(userId, courseId);
      
      return res.status(200).json({ message: 'Unenrolled successfully' });
    } catch (error) {
      console.error('Unenrollment error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Exam timetable routes
  app.get('/api/exam-timetable', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const timetables = await storage.getUserExamTimetables(userId);
      
      // Get course details for each timetable entry
      const enrichedTimetables = await Promise.all(
        timetables.map(async (timetable) => {
          const course = await storage.getCourse(timetable.courseId);
          return {
            ...timetable,
            course
          };
        })
      );
      
      return res.status(200).json({ timetables: enrichedTimetables });
    } catch (error) {
      console.error('Exam timetable error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/exam-timetable', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const { courseId, examDate, location, notes } = req.body;
      
      if (!courseId || !examDate) {
        return res.status(400).json({ message: 'Course ID and exam date are required' });
      }
      
      // Check if user is enrolled in the course
      const isEnrolled = await storage.isUserEnrolledInCourse(userId, courseId);
      if (!isEnrolled) {
        return res.status(403).json({ message: 'You must be enrolled in this course to add exam details' });
      }
      
      // Create exam timetable entry
      const timetable = await storage.createExamTimetable({
        userId,
        courseId,
        examDate: new Date(examDate),
        location,
        notes
      });
      
      // Get course details
      const course = await storage.getCourse(courseId);
      
      return res.status(201).json({
        message: 'Exam timetable entry created successfully',
        timetable: {
          ...timetable,
          course
        }
      });
    } catch (error) {
      console.error('Create exam timetable error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.put('/api/exam-timetable/:id', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const timetableId = parseInt(req.params.id);
      const { examDate, location, notes } = req.body;
      
      // Find the timetable entry
      const timetable = await storage.getExamTimetable(timetableId);
      
      if (!timetable) {
        return res.status(404).json({ message: 'Exam timetable entry not found' });
      }
      
      // Ensure the user owns this timetable entry
      if (timetable.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      // Update the timetable entry
      const updatedTimetable = await storage.updateExamTimetable(timetableId, {
        examDate: examDate ? new Date(examDate) : undefined,
        location,
        notes
      });
      
      // Get course details
      const course = await storage.getCourse(timetable.courseId);
      
      return res.status(200).json({
        message: 'Exam timetable entry updated successfully',
        timetable: {
          ...updatedTimetable,
          course
        }
      });
    } catch (error) {
      console.error('Update exam timetable error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.delete('/api/exam-timetable/:id', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const timetableId = parseInt(req.params.id);
      
      // Find the timetable entry
      const timetable = await storage.getExamTimetable(timetableId);
      
      if (!timetable) {
        return res.status(404).json({ message: 'Exam timetable entry not found' });
      }
      
      // Ensure the user owns this timetable entry
      if (timetable.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      // Delete the timetable entry
      await storage.deleteExamTimetable(timetableId);
      
      return res.status(200).json({ message: 'Exam timetable entry deleted successfully' });
    } catch (error) {
      console.error('Delete exam timetable error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Add an endpoint to check enrollment status
  app.get('/api/enrollments/:courseId', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const courseId = parseInt(req.params.courseId);
      
      const isEnrolled = await storage.isUserEnrolledInCourse(userId, courseId);
      
      return res.status(200).json({ isEnrolled });
    } catch (error) {
      console.error('Enrollment check error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Course materials access check
  app.get('/api/course/:courseId/materials', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const courseId = parseInt(req.params.courseId);
      
      // Check if user is enrolled in the course
      const isEnrolled = await storage.isUserEnrolledInCourse(userId, courseId);
      
      if (!isEnrolled && req.session.user!.role !== 'admin') {
        return res.status(403).json({ message: 'You must be enrolled in this course to access materials' });
      }
      
      // Get course materials
      const materials = await storage.getCourseMaterials(courseId);
      
      return res.status(200).json({ materials });
    } catch (error) {
      console.error('Course materials error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/admin/materials', upload.single('file'), async (req: Request, res: Response) => {
    if (!isAuthenticated(req) || req.session.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    try {
      const { courseId, title, type, content } = req.body;
      const file = req.file;
      
      // Validate required fields
      if (!courseId || !title || !type) {
        return res.status(400).json({ message: 'Course ID, title, and type are required fields' });
      }
      
      // Determine fields based on type
      let fileUrl = undefined;
      let duration = undefined;
      let pages = undefined;
      let questions = undefined;
      
      if (file) {
        fileUrl = file.path;
        
        if (type.toLowerCase() === 'pdf' && file.mimetype === 'application/pdf') {
          try {
            const pdfData = await pdfParse(fs.readFileSync(file.path));
            pages = pdfData.numpages;
          } catch (err) {
            console.error('Error parsing PDF:', err);
          }
        }
      }
      
      if (type.toLowerCase() === 'video') {
        duration = req.body.duration;
      } else if (type.toLowerCase() === 'quiz') {
        questions = parseInt(req.body.questions);
      }
      
      // Create the material
      const newMaterial = await storage.createCourseMaterial({
        courseId: parseInt(courseId),
        title,
        type,
        content: content || '',
        fileUrl,
        duration,
        pages: pages ? parseInt(pages) : undefined,
        questions
      });
      
      return res.status(201).json({ 
        message: 'Material created successfully',
        material: newMaterial
      });
    } catch (error) {
      console.error('Material creation error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/admin/courses/:id/exams', async (req: Request, res: Response) => {
    if (!isAuthenticated(req) || req.session.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    try {
      const courseId = parseInt(req.params.id);
      const { title, description, type, date } = req.body;
      
      // Validate required fields
      if (!title || !type) {
        return res.status(400).json({ message: 'Title and type are required fields' });
      }
      
      // Create the exam
      const newExam = await storage.createExam({
        courseId,
        title,
        description: description || '',
        type,
        date: date ? new Date(date) : undefined
      });
      
      return res.status(201).json({ 
        message: 'Exam created successfully',
        exam: newExam
      });
    } catch (error) {
      console.error('Exam creation error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Material viewing endpoint for PDFs
  app.get('/api/materials/:id/view', async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.session.user!.id;
      const materialId = parseInt(req.params.id);
      
      // Get material
      const material = await storage.getCourseMaterial(materialId);
      if (!material) {
        return res.status(404).json({ message: 'Material not found' });
      }
      
      // Check if user is enrolled in the course or is admin
      const isEnrolled = await storage.isUserEnrolledInCourse(userId, material.courseId);
      if (!isEnrolled && req.session.user!.role !== 'admin') {
        return res.status(403).json({ message: 'You must be enrolled in this course to view materials' });
      }
      
      // If material is a PDF and has a file URL, prepare for viewing
      if (material.type.toLowerCase() === 'pdf' && material.fileUrl) {
        // Convert from server path to Express static URL if needed
        let pdfUrl = material.fileUrl;
        if (pdfUrl.startsWith(uploadDir)) {
          pdfUrl = pdfUrl.replace(uploadDir, '/uploads');
        }
        
        return res.status(200).json({ 
          material,
          pdfUrl
        });
      } else {
        return res.status(200).json({ material });
      }
    } catch (error) {
      console.error('Material view error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Register AI Tutor routes
  app.use('/api/tutor', tutorRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
