import {
  User, InsertUser, Course, InsertCourse, CourseMaterial,
  InsertCourseMaterial, Exam, InsertExam, Question, InsertQuestion,
  UserProgress, InsertUserProgress, Job, InsertJob, ForumPost,
  InsertForumPost, ForumReply, InsertForumReply, ChatMessage,
  InsertChatMessage, ChatUsage, InsertChatUsage, Subscription, InsertSubscription
} from "@shared/schema";
import bcrypt from 'bcryptjs';

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;

  // Course operations
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getCourseByCode(code: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;

  // Course Material operations
  getCourseMaterials(courseId?: number): Promise<CourseMaterial[]>;
  getCourseMaterial(id: number): Promise<CourseMaterial | undefined>;
  createCourseMaterial(material: InsertCourseMaterial): Promise<CourseMaterial>;

  // Exam operations
  getExams(courseId?: number): Promise<Exam[]>;
  getExam(id: number): Promise<Exam | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;

  // Question operations
  getQuestions(courseId: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;

  // Progress operations
  getUserProgress(userId: number): Promise<UserProgress[]>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: number, data: Partial<UserProgress>): Promise<UserProgress | undefined>;

  // Job operations
  getJobs(filters?: Partial<{ location: string, type: string, faculty: string }>): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;

  // Forum operations
  getForumPosts(category?: string): Promise<ForumPost[]>;
  getForumPost(id: number): Promise<ForumPost | undefined>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  getForumReplies(postId: number): Promise<ForumReply[]>;
  createForumReply(reply: InsertForumReply): Promise<ForumReply>;
  incrementPostViews(postId: number): Promise<void>;

  // Chat operations
  getChatMessages(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatUsage(userId: number): Promise<ChatUsage | undefined>;
  updateChatUsage(userId: number, used: number): Promise<ChatUsage>;

  // Subscription operations
  getUserSubscription(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private courseMaterials: Map<number, CourseMaterial>;
  private exams: Map<number, Exam>;
  private questions: Map<number, Question>;
  private userProgress: Map<number, UserProgress>;
  private jobs: Map<number, Job>;
  private forumPosts: Map<number, ForumPost>;
  private forumReplies: Map<number, ForumReply>;
  private chatMessages: Map<number, ChatMessage>;
  private chatUsage: Map<number, ChatUsage>;
  private subscriptions: Map<number, Subscription>;

  private currentIds: {
    user: number;
    course: number;
    courseMaterial: number;
    exam: number;
    question: number;
    userProgress: number;
    job: number;
    forumPost: number;
    forumReply: number;
    chatMessage: number;
    chatUsage: number;
    subscription: number;
  };

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.courseMaterials = new Map();
    this.exams = new Map();
    this.questions = new Map();
    this.userProgress = new Map();
    this.jobs = new Map();
    this.forumPosts = new Map();
    this.forumReplies = new Map();
    this.chatMessages = new Map();
    this.chatUsage = new Map();
    this.subscriptions = new Map();

    this.currentIds = {
      user: 1,
      course: 1,
      courseMaterial: 1,
      exam: 1,
      question: 1,
      userProgress: 1,
      job: 1,
      forumPost: 1,
      forumReply: 1,
      chatMessage: 1,
      chatUsage: 1,
      subscription: 1,
    };

    // Initialize with sample data
    this.seedData();
  }

  private seedData() {
    // Initialize sample courses
    const courses = [
      { code: 'MTH 103', title: 'Elementary Mathematics III', description: 'Vector algebra, matrices, and determinants', level: '100L', faculty: 'Science', semester: '1' },
      { code: 'CIT 101', title: 'Introduction to Computer Science', description: 'Basic concepts of computer systems', level: '100L', faculty: 'Computing', semester: '1' },
      { code: 'GST 102', title: 'Use of English & Communication Skills', description: 'Language skills and effective communication', level: '100L', faculty: 'General Studies', semester: '1' },
    ];

    courses.forEach(course => {
      this.createCourse(course);
    });

    // Initialize sample exams
    const exams = [
      { courseId: 1, title: 'MTH 103 Midterm', description: 'Covers the first half of the syllabus', type: 'E-Exam', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
      { courseId: 2, title: 'CIT 101 Midterm', description: 'Practical and theory components', type: 'E-Exam', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { courseId: 3, title: 'GST 102 Final', description: 'Comprehensive assessment', type: 'Pen-on-Paper', date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
    ];

    exams.forEach(exam => {
      this.createExam(exam);
    });

    // Initialize sample materials
    const materials = [
      { courseId: 1, title: 'MTH 103 - Module 1', type: 'PDF', content: 'Vector Algebra & Matrices', pages: 35 },
      { courseId: 2, title: 'CIT 101 - Tutorial', type: 'Video', content: 'Programming Concepts', duration: '45 minutes' },
      { courseId: 3, title: 'GST 102 - Practice', type: 'Quiz', content: 'Grammar & Vocabulary', questions: 20 },
    ];

    materials.forEach(material => {
      this.createCourseMaterial(material as InsertCourseMaterial);
    });

    // Initialize sample jobs
    const jobs = [
      { title: 'Frontend Developer (Intern)', company: 'TechNaija Solutions', location: 'Lagos', type: 'Remote', description: 'Web development using React', requirements: '100L or higher Computer Science students', applicationUrl: 'https://example.com/apply' },
      { title: 'Data Analyst', company: 'FinTech Holdings', location: 'Abuja', type: 'Hybrid', description: 'Financial data analysis', requirements: 'Statistics or Mathematics background', applicationUrl: 'https://example.com/apply' },
      { title: 'Content Writer', company: 'EduTech Nigeria', location: 'Remote', type: 'Part-time', description: 'Educational content creation', requirements: 'Excellent English writing skills', applicationUrl: 'https://example.com/apply' },
    ];

    jobs.forEach(job => {
      this.createJob(job as InsertJob);
    });

    // Initialize sample forum posts
    const posts = [
      { userId: 1, title: 'MTH 103 exam center location?', content: 'Has anyone received info about the MTH 103 exam center location?', category: 'Exams', tags: ['MTH103', 'location', 'exam'] },
      { userId: 2, title: 'CIT 101 resources', content: 'Just found some great CIT 101 resources. Check them out!', category: 'Resources', tags: ['CIT101', 'resources'] },
    ];

    posts.forEach(post => {
      this.createForumPost(post as InsertForumPost);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.user++;
    // Hash the password
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const user: User = { 
      ...insertUser, 
      id, 
      password: hashedPassword,
      isVerified: false,
      createdAt: new Date() 
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    // Hash password if it's being updated
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCourseByCode(code: string): Promise<Course | undefined> {
    return Array.from(this.courses.values()).find(
      (course) => course.code.toLowerCase() === code.toLowerCase()
    );
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.currentIds.course++;
    const course: Course = { ...insertCourse, id };
    this.courses.set(id, course);
    return course;
  }

  // Course Material operations
  async getCourseMaterials(courseId?: number): Promise<CourseMaterial[]> {
    const materials = Array.from(this.courseMaterials.values());
    if (courseId) {
      return materials.filter(m => m.courseId === courseId);
    }
    return materials;
  }

  async getCourseMaterial(id: number): Promise<CourseMaterial | undefined> {
    return this.courseMaterials.get(id);
  }

  async createCourseMaterial(insertMaterial: InsertCourseMaterial): Promise<CourseMaterial> {
    const id = this.currentIds.courseMaterial++;
    const material: CourseMaterial = { ...insertMaterial, id, createdAt: new Date() };
    this.courseMaterials.set(id, material);
    return material;
  }

  // Exam operations
  async getExams(courseId?: number): Promise<Exam[]> {
    const exams = Array.from(this.exams.values());
    if (courseId) {
      return exams.filter(e => e.courseId === courseId);
    }
    return exams;
  }

  async getExam(id: number): Promise<Exam | undefined> {
    return this.exams.get(id);
  }

  async createExam(insertExam: InsertExam): Promise<Exam> {
    const id = this.currentIds.exam++;
    const exam: Exam = { ...insertExam, id, createdAt: new Date() };
    this.exams.set(id, exam);
    return exam;
  }

  // Question operations
  async getQuestions(courseId: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(q => q.courseId === courseId);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.currentIds.question++;
    const question: Question = { ...insertQuestion, id, createdAt: new Date() };
    this.questions.set(id, question);
    return question;
  }

  // Progress operations
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values()).filter(p => p.userId === userId);
  }

  async createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const id = this.currentIds.userProgress++;
    const progress: UserProgress = { ...insertProgress, id, timestamp: new Date() };
    this.userProgress.set(id, progress);
    return progress;
  }

  async updateUserProgress(id: number, data: Partial<UserProgress>): Promise<UserProgress | undefined> {
    const progress = this.userProgress.get(id);
    if (!progress) return undefined;

    const updatedProgress = { ...progress, ...data };
    this.userProgress.set(id, updatedProgress);
    return updatedProgress;
  }

  // Job operations
  async getJobs(filters?: Partial<{ location: string, type: string, faculty: string }>): Promise<Job[]> {
    let jobs = Array.from(this.jobs.values());
    
    if (filters) {
      if (filters.location) {
        jobs = jobs.filter(j => j.location?.toLowerCase().includes(filters.location!.toLowerCase()));
      }
      if (filters.type) {
        jobs = jobs.filter(j => j.type?.toLowerCase() === filters.type!.toLowerCase());
      }
      if (filters.faculty) {
        jobs = jobs.filter(j => j.faculty?.toLowerCase() === filters.faculty!.toLowerCase());
      }
    }
    
    return jobs;
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.currentIds.job++;
    const job: Job = { ...insertJob, id, postedAt: new Date() };
    this.jobs.set(id, job);
    return job;
  }

  // Forum operations
  async getForumPosts(category?: string): Promise<ForumPost[]> {
    let posts = Array.from(this.forumPosts.values());
    if (category) {
      posts = posts.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    return posts;
  }

  async getForumPost(id: number): Promise<ForumPost | undefined> {
    return this.forumPosts.get(id);
  }

  async createForumPost(insertPost: InsertForumPost): Promise<ForumPost> {
    const id = this.currentIds.forumPost++;
    const post: ForumPost = { ...insertPost, id, views: 0, createdAt: new Date() };
    this.forumPosts.set(id, post);
    return post;
  }

  async getForumReplies(postId: number): Promise<ForumReply[]> {
    return Array.from(this.forumReplies.values()).filter(r => r.postId === postId);
  }

  async createForumReply(insertReply: InsertForumReply): Promise<ForumReply> {
    const id = this.currentIds.forumReply++;
    const reply: ForumReply = { ...insertReply, id, createdAt: new Date() };
    this.forumReplies.set(id, reply);
    return reply;
  }

  async incrementPostViews(postId: number): Promise<void> {
    const post = await this.getForumPost(postId);
    if (post) {
      post.views += 1;
      this.forumPosts.set(postId, post);
    }
  }

  // Chat operations
  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(m => m.userId === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentIds.chatMessage++;
    const message: ChatMessage = { ...insertMessage, id, createdAt: new Date() };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatUsage(userId: number): Promise<ChatUsage | undefined> {
    // Find chat usage for the user for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.chatUsage.values()).find(
      u => u.userId === userId && u.date.getTime() >= today.getTime()
    );
  }

  async updateChatUsage(userId: number, used: number): Promise<ChatUsage> {
    const existing = await this.getChatUsage(userId);
    
    if (existing) {
      existing.promptsUsed += used;
      this.chatUsage.set(existing.id, existing);
      return existing;
    } else {
      const id = this.currentIds.chatUsage++;
      const usage: ChatUsage = { 
        id, 
        userId, 
        date: new Date(), 
        promptsUsed: used 
      };
      this.chatUsage.set(id, usage);
      return usage;
    }
  }

  // Subscription operations
  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      s => s.userId === userId
    );
  }

  async createSubscription(insertSub: InsertSubscription): Promise<Subscription> {
    const id = this.currentIds.subscription++;
    const now = new Date();
    
    // If it's premium, set end date to 30 days from now
    let endDate = undefined;
    if (insertSub.tier === 'Premium') {
      endDate = new Date();
      endDate.setDate(now.getDate() + 30);
    }
    
    const subscription: Subscription = { 
      ...insertSub, 
      id, 
      startDate: now,
      endDate
    };
    
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;

    const updatedSub = { ...subscription, ...data };
    this.subscriptions.set(id, updatedSub);
    return updatedSub;
  }
}

export const storage = new MemStorage();
