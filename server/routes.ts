import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateAIResponse, generateCourseSummary, generateQuizQuestions } from "./openai";
import bcrypt from 'bcryptjs';
import session from 'express-session';
import MemoryStore from 'memorystore';

// User-defined type guard for checking if the user is logged in
function isAuthenticated(req: Request): boolean {
  return req.session && req.session.user !== undefined;
}

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
      
      // Create user
      const newUser = await storage.createUser({
        firstName,
        email,
        password,
        school: school || 'National Open University of Nigeria',
        referralCode
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
        school: newUser.school
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
        school: user.school
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
      const materials = await storage.getCourseMaterials(courseId);
      return res.status(200).json({ materials });
    } catch (error) {
      console.error('Materials error:', error);
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
      
      // Get details for each progress entry
      const enrichedProgress = await Promise.all(
        progress.map(async (p) => {
          const course = await storage.getCourse(p.courseId);
          const material = p.materialId ? await storage.getCourseMaterial(p.materialId) : null;
          const exam = p.examId ? await storage.getExam(p.examId) : null;
          
          return {
            ...p,
            course: course ? { id: course.id, code: course.code, title: course.title } : null,
            material: material ? { id: material.id, title: material.title, type: material.type } : null,
            exam: exam ? { id: exam.id, title: exam.title, type: exam.type } : null
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
      const { courseId, materialId, examId, score, completed } = req.body;
      
      if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required' });
      }
      
      const newProgress = await storage.createUserProgress({
        userId,
        courseId,
        materialId,
        examId,
        score,
        completed: completed || false
      });
      
      return res.status(201).json({ 
        message: 'Progress saved successfully',
        progress: newProgress
      });
    } catch (error) {
      console.error('Save progress error:', error);
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
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      });
      
      return res.status(200).json({ jobs });
    } catch (error) {
      console.error('Jobs error:', error);
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
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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
      
      // Check subscription tier and chat usage limits
      const subscription = await storage.getUserSubscription(userId);
      const tier = subscription ? subscription.tier : 'Free';
      
      if (tier === 'Free') {
        const usage = await storage.getChatUsage(userId);
        const promptsUsed = usage ? usage.promptsUsed : 0;
        
        // Free tier users get 5 prompts per day
        if (promptsUsed >= 5) {
          return res.status(403).json({ 
            message: 'You have reached your daily limit of 5 free prompts. Upgrade to Premium for unlimited access.',
            promptsUsed,
            promptLimit: 5
          });
        }
        
        // Update usage
        await storage.updateChatUsage(userId, 1);
      }
      
      // Save user message
      await storage.createChatMessage({
        userId,
        content: prompt,
        isUserMessage: true
      });
      
      // Generate AI response
      const aiResponse = await generateAIResponse(prompt);
      
      // Save AI response
      const savedResponse = await storage.createChatMessage({
        userId,
        content: aiResponse,
        isUserMessage: false
      });
      
      // Get updated usage
      const updatedUsage = await storage.getChatUsage(userId);
      const promptsUsed = updatedUsage ? updatedUsage.promptsUsed : 0;
      
      return res.status(200).json({ 
        message: savedResponse,
        promptsUsed,
        promptLimit: tier === 'Free' ? 5 : null
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
      const messages = await storage.getChatMessages(userId);
      
      // Get usage info
      const subscription = await storage.getUserSubscription(userId);
      const tier = subscription ? subscription.tier : 'Free';
      const usage = await storage.getChatUsage(userId);
      const promptsUsed = usage ? usage.promptsUsed : 0;
      
      return res.status(200).json({ 
        messages,
        promptsUsed,
        promptLimit: tier === 'Free' ? 5 : null
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

  const httpServer = createServer(app);

  return httpServer;
}
