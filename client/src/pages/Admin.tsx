import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Pencil, Trash2, School, Book, FileText, Users } from 'lucide-react';

const Admin: React.FC = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');

  // Role-based access control
  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Unauthorized Access</h2>
          <p className="text-red-700">You do not have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  // Users management query
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  // Courses management query
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/admin/courses'],
  });

  // Materials management query
  const { data: materialsData, isLoading: materialsLoading } = useQuery({
    queryKey: ['/api/admin/materials'],
  });

  // Study centers management query
  const { data: centersData, isLoading: centersLoading } = useQuery({
    queryKey: ['/api/admin/centers'],
  });

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

  return (
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
                <Button className="bg-forest-600 hover:bg-forest-700 text-white flex items-center gap-1">
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
                <Button className="bg-forest-600 hover:bg-forest-700 text-white flex items-center gap-1">
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
                <Button className="bg-forest-600 hover:bg-forest-700 text-white flex items-center gap-1">
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
                <Button className="bg-forest-600 hover:bg-forest-700 text-white flex items-center gap-1">
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
  );
};

export default Admin;