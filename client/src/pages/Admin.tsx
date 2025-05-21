import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Pencil, Trash2, School, Book, FileText, Users, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Function to fetch data for admin APIs
const fetchAdminData = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

// Function to create a new study center
const createStudyCenter = async (center: { name: string; state: string; address: string; contact: string }) => {
  const response = await fetch('/api/admin/centers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(center),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create study center');
  }
  
  return response.json();
};

// Function to create a new user
const createUser = async (user: { firstName: string; email: string; password: string; role: string; school: string }) => {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create user');
  }
  
  return response.json();
};

// Function to create a new course
const createCourse = async (course: { code: string; title: string; faculty: string; level: string; description: string }) => {
  const response = await fetch('/api/admin/courses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(course),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create course');
  }
  
  return response.json();
};

// Function to create a new material
const createMaterial = async (material: { title: string; courseId: number; type: string; description: string; fileUrl: string }) => {
  const response = await fetch('/api/admin/materials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(material),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create material');
  }
  
  return response.json();
};

const Admin: React.FC = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();
  
  // State for center modal
  const [centerModalOpen, setCenterModalOpen] = useState(false);
  const [newCenter, setNewCenter] = useState({
    name: '',
    state: '',
    address: '',
    contact: ''
  });
  
  // State for user modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    school: 'National Open University of Nigeria'
  });
  
  // State for course modal
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: '',
    title: '',
    faculty: '',
    level: '100',
    description: ''
  });
  
  // State for material modal
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    courseId: 0,
    type: 'PDF',
    description: '',
    fileUrl: ''
  });

  // Always call useQuery hooks unconditionally, but control their execution with enabled option
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: () => fetchAdminData('/api/admin/users'),
    enabled: isAdmin && activeTab === 'users',
  });

  // Courses management query
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/admin/courses'],
    queryFn: () => fetchAdminData('/api/admin/courses'),
    enabled: isAdmin && activeTab === 'courses',
  });

  // Materials management query
  const { data: materialsData, isLoading: materialsLoading } = useQuery({
    queryKey: ['/api/admin/materials'],
    queryFn: () => fetchAdminData('/api/admin/materials'),
    enabled: isAdmin && activeTab === 'materials',
  });

  // Study centers management query
  const { data: centersData, isLoading: centersLoading } = useQuery({
    queryKey: ['/api/admin/centers'],
    queryFn: () => fetchAdminData('/api/admin/centers'),
    enabled: isAdmin && activeTab === 'centers',
  });

  // Mutation for creating a study center
  const createCenterMutation = useMutation({
    mutationFn: createStudyCenter,
    onSuccess: () => {
      // Invalidate and refetch the centers query
      queryClient.invalidateQueries({ queryKey: ['/api/admin/centers'] });
      // Reset form and close modal
      setNewCenter({ name: '', state: '', address: '', contact: '' });
      setCenterModalOpen(false);
      // Show success toast
      toast({ title: 'Success', description: 'Study center created successfully.' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create study center.',
        variant: 'destructive'
      });
    }
  });
  
  // Mutation for creating a user
  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      // Invalidate and refetch the users query
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      // Reset form and close modal
      setNewUser({
        firstName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        school: 'National Open University of Nigeria'
      });
      setUserModalOpen(false);
      // Show success toast
      toast({ title: 'Success', description: 'User created successfully.' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create user.',
        variant: 'destructive'
      });
    }
  });
  
  // Mutation for creating a course
  const createCourseMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      // Invalidate and refetch the courses query
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      // Reset form and close modal
      setNewCourse({
        code: '',
        title: '',
        faculty: '',
        level: '100',
        description: ''
      });
      setCourseModalOpen(false);
      // Show success toast
      toast({ title: 'Success', description: 'Course created successfully.' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create course.',
        variant: 'destructive'
      });
    }
  });
  
  // Mutation for creating a material
  const createMaterialMutation = useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      // Invalidate and refetch the materials query
      queryClient.invalidateQueries({ queryKey: ['/api/admin/materials'] });
      // Reset form and close modal
      setNewMaterial({
        title: '',
        courseId: 0,
        type: 'PDF',
        description: '',
        fileUrl: ''
      });
      setMaterialModalOpen(false);
      // Show success toast
      toast({ title: 'Success', description: 'Material created successfully.' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create material.',
        variant: 'destructive'
      });
    }
  });

  // Handle creating a new center
  const handleCreateCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCenter.name || !newCenter.state) {
      toast({
        title: 'Validation Error',
        description: 'Name and state are required fields.',
        variant: 'destructive'
      });
      return;
    }
    createCenterMutation.mutate(newCenter);
  };
  
  // Handle creating a new user
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.firstName || !newUser.email || !newUser.password) {
      toast({
        title: 'Validation Error',
        description: 'Name, email, and password are required fields.',
        variant: 'destructive'
      });
      return;
    }
    
    if (newUser.password !== newUser.confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match.',
        variant: 'destructive'
      });
      return;
    }
    
    // Call mutation, excluding confirmPassword
    const { confirmPassword, ...userData } = newUser;
    createUserMutation.mutate(userData);
  };
  
  // Handle creating a new course
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.code || !newCourse.title || !newCourse.faculty) {
      toast({
        title: 'Validation Error',
        description: 'Course code, title, and faculty are required fields.',
        variant: 'destructive'
      });
      return;
    }
    
    createCourseMutation.mutate(newCourse);
  };
  
  // Handle creating a new material
  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title || !newMaterial.courseId) {
      toast({
        title: 'Validation Error',
        description: 'Title and course are required fields.',
        variant: 'destructive'
      });
      return;
    }
    
    createMaterialMutation.mutate(newMaterial);
  };

  // Generic handler for edit action
  const handleEdit = (type: string, id: number) => {
    toast({
      title: 'Edit initiated',
      description: `Editing ${type} with ID: ${id}`,
    });
  };

  // Generic handler for delete action
  const handleDelete = (type: string, id: number) => {
    toast({
      title: 'Confirm deletion',
      description: `Are you sure you want to delete this ${type}?`,
      variant: 'destructive',
    });
  };

  // Common loading state
  const renderLoading = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  // Role-based access control - rendered after all hooks are called
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Unauthorized Access</h2>
          <p className="text-red-700">You do not have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-forest-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage platform content and users</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                className="pl-9 max-w-xs" 
                placeholder="Search..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="users" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-1">
              <Book className="h-4 w-4" />
              <span className="hidden sm:inline">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Materials</span>
            </TabsTrigger>
            <TabsTrigger value="centers" className="flex items-center gap-1">
              <School className="h-4 w-4" />
              <span className="hidden sm:inline">Study Centers</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage the platform's user accounts</CardDescription>
                  </div>
                  <Button 
                    className="bg-forest-600 hover:bg-forest-700 text-white flex items-center gap-1"
                    onClick={() => setUserModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  renderLoading()
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Study Center</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(usersData?.users) && usersData?.users.length > 0 ? (
                          usersData.users.map((user: any) => (
                            <TableRow key={user.id}>
                              <TableCell>{user.id}</TableCell>
                              <TableCell>
                                {user.firstName} {user.lastName}
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.studyCenter}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.status || 'inactive'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleEdit('user', user.id)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-red-500 border-red-300 hover:bg-red-50"
                                    onClick={() => handleDelete('user', user.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                              No users found. Add a new user to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Course Management</CardTitle>
                    <CardDescription>Manage academic courses and their content</CardDescription>
                  </div>
                  <Button 
                    className="bg-forest-600 hover:bg-forest-700 text-white flex items-center gap-1"
                    onClick={() => setCourseModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Course
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {coursesLoading ? (
                  renderLoading()
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Faculty</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Materials</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(coursesData?.courses) && coursesData?.courses.length > 0 ? (
                          coursesData.courses.map((course: any) => (
                            <TableRow key={course.id}>
                              <TableCell className="font-medium">{course.code}</TableCell>
                              <TableCell>{course.title}</TableCell>
                              <TableCell>{course.faculty}</TableCell>
                              <TableCell>{course.level}</TableCell>
                              <TableCell>{course.materialsCount || 0}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleEdit('course', course.id)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-red-500 border-red-300 hover:bg-red-50"
                                    onClick={() => handleDelete('course', course.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                              No courses found. Add a new course to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Learning Materials</CardTitle>
                    <CardDescription>Manage course materials and resources</CardDescription>
                  </div>
                  <Button 
                    className="bg-forest-600 hover:bg-forest-700 text-white flex items-center gap-1"
                    onClick={() => setMaterialModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Material
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {materialsLoading ? (
                  renderLoading()
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Added</TableHead>
                          <TableHead>Downloads</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(materialsData?.materials) && materialsData?.materials.length > 0 ? (
                          materialsData.materials.map((material: any) => (
                            <TableRow key={material.id}>
                              <TableCell className="font-medium">{material.title}</TableCell>
                              <TableCell>{material.courseCode}</TableCell>
                              <TableCell>{material.type}</TableCell>
                              <TableCell>{new Date(material.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>{material.downloads || 0}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleEdit('material', material.id)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-red-500 border-red-300 hover:bg-red-50"
                                    onClick={() => handleDelete('material', material.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                              No materials found. Add learning materials to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Study Centers Tab */}
          <TabsContent value="centers">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Study Centers</CardTitle>
                    <CardDescription>Manage NOUN study centers information</CardDescription>
                  </div>
                  <Button 
                    className="bg-forest-600 hover:bg-forest-700 text-white flex items-center gap-1"
                    onClick={() => setCenterModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Center
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {centersLoading ? (
                  renderLoading()
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Students</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(centersData?.centers) && centersData?.centers.length > 0 ? (
                          centersData.centers.map((center: any) => (
                            <TableRow key={center.id}>
                              <TableCell className="font-medium">{center.name}</TableCell>
                              <TableCell>{center.state}</TableCell>
                              <TableCell>{center.address}</TableCell>
                              <TableCell>{center.contact}</TableCell>
                              <TableCell>{center.studentCount || 0}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleEdit('center', center.id)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-red-500 border-red-300 hover:bg-red-50"
                                    onClick={() => handleDelete('center', center.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                              No study centers found. Add a new center to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Center Modal */}
      <Dialog open={centerModalOpen} onOpenChange={setCenterModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Study Center</DialogTitle>
            <DialogDescription>
              Create a new NOUN study center. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCenter}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="center-name" className="text-right">
                  Name*
                </Label>
                <Input
                  id="center-name"
                  value={newCenter.name}
                  onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                  className="col-span-3"
                  placeholder="Lagos Study Center"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="center-state" className="text-right">
                  State*
                </Label>
                <Input
                  id="center-state"
                  value={newCenter.state}
                  onChange={(e) => setNewCenter({ ...newCenter, state: e.target.value })}
                  className="col-span-3"
                  placeholder="Lagos"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="center-address" className="text-right">
                  Address
                </Label>
                <Input
                  id="center-address"
                  value={newCenter.address}
                  onChange={(e) => setNewCenter({ ...newCenter, address: e.target.value })}
                  className="col-span-3"
                  placeholder="123 Main Street, Yaba"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="center-contact" className="text-right">
                  Contact
                </Label>
                <Input
                  id="center-contact"
                  value={newCenter.contact}
                  onChange={(e) => setNewCenter({ ...newCenter, contact: e.target.value })}
                  className="col-span-3"
                  placeholder="+234 123 456 7890"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCenterModalOpen(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-forest-600 hover:bg-forest-700 text-white"
                disabled={createCenterMutation.isPending}
              >
                {createCenterMutation.isPending ? "Creating..." : "Create Center"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add User Modal */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Create a new user account. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user-name" className="text-right">
                  Name*
                </Label>
                <Input
                  id="user-name"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  className="col-span-3"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user-email" className="text-right">
                  Email*
                </Label>
                <Input
                  id="user-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="col-span-3"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user-password" className="text-right">
                  Password*
                </Label>
                <Input
                  id="user-password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user-confirm-password" className="text-right">
                  Confirm*
                </Label>
                <Input
                  id="user-confirm-password"
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user-role" className="text-right">
                  Role
                </Label>
                <select
                  id="user-role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="col-span-3 p-2 border rounded-md"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setUserModalOpen(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-forest-600 hover:bg-forest-700 text-white"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add Course Modal */}
      <Dialog open={courseModalOpen} onOpenChange={setCourseModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Course</DialogTitle>
            <DialogDescription>
              Create a new academic course. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCourse}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="course-code" className="text-right">
                  Code*
                </Label>
                <Input
                  id="course-code"
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value.toUpperCase() })}
                  className="col-span-3"
                  placeholder="CSS101"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="course-title" className="text-right">
                  Title*
                </Label>
                <Input
                  id="course-title"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="col-span-3"
                  placeholder="Introduction to Computer Science"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="course-faculty" className="text-right">
                  Faculty*
                </Label>
                <Input
                  id="course-faculty"
                  value={newCourse.faculty}
                  onChange={(e) => setNewCourse({ ...newCourse, faculty: e.target.value })}
                  className="col-span-3"
                  placeholder="Science and Technology"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="course-level" className="text-right">
                  Level
                </Label>
                <select
                  id="course-level"
                  value={newCourse.level}
                  onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                  className="col-span-3 p-2 border rounded-md"
                >
                  <option value="100">100 Level</option>
                  <option value="200">200 Level</option>
                  <option value="300">300 Level</option>
                  <option value="400">400 Level</option>
                  <option value="500">500 Level</option>
                  <option value="PG">Postgraduate</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="course-description" className="text-right">
                  Description
                </Label>
                <Input
                  id="course-description"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Brief description of the course"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCourseModalOpen(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-forest-600 hover:bg-forest-700 text-white"
                disabled={createCourseMutation.isPending}
              >
                {createCourseMutation.isPending ? "Creating..." : "Create Course"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add Material Modal */}
      <Dialog open={materialModalOpen} onOpenChange={setMaterialModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Learning Material</DialogTitle>
            <DialogDescription>
              Create a new learning material for a course. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMaterial}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="material-title" className="text-right">
                  Title*
                </Label>
                <Input
                  id="material-title"
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  className="col-span-3"
                  placeholder="Introduction to Variables"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="material-course" className="text-right">
                  Course*
                </Label>
                <select
                  id="material-course"
                  value={newMaterial.courseId || ''}
                  onChange={(e) => setNewMaterial({ ...newMaterial, courseId: parseInt(e.target.value) || 0 })}
                  className="col-span-3 p-2 border rounded-md"
                  required
                >
                  <option value="">Select a course</option>
                  {Array.isArray(coursesData?.courses) && coursesData?.courses.map((course: any) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="material-type" className="text-right">
                  Type
                </Label>
                <select
                  id="material-type"
                  value={newMaterial.type}
                  onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value })}
                  className="col-span-3 p-2 border rounded-md"
                >
                  <option value="PDF">PDF</option>
                  <option value="Video">Video</option>
                  <option value="Slides">Slides</option>
                  <option value="Notes">Notes</option>
                  <option value="Link">External Link</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="material-url" className="text-right">
                  File URL
                </Label>
                <Input
                  id="material-url"
                  value={newMaterial.fileUrl}
                  onChange={(e) => setNewMaterial({ ...newMaterial, fileUrl: e.target.value })}
                  className="col-span-3"
                  placeholder="https://example.com/file.pdf"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="material-description" className="text-right">
                  Description
                </Label>
                <Input
                  id="material-description"
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Brief description of the material"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setMaterialModalOpen(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-forest-600 hover:bg-forest-700 text-white"
                disabled={createMaterialMutation.isPending}
              >
                {createMaterialMutation.isPending ? "Creating..." : "Create Material"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Admin;