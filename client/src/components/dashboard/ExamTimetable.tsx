import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ExamTimetable as ExamTimetableType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { UserEnrollmentsProvider, useUserEnrollments } from '@/context/UserEnrollmentsContext';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface ExamTimetableResponse {
  timetables: ExamTimetableType[];
}

interface ExamTimetableProps {
  className?: string;
}

const ExamEntryForm: React.FC<{
  onClose: () => void;
  editData?: ExamTimetableType;
}> = ({ onClose, editData }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { enrollments } = useUserEnrollments();
  
  const [formData, setFormData] = useState({
    courseId: editData?.courseId?.toString() || '',
    examDate: editData?.examDate ? parseISO(editData.examDate) : new Date(),
    location: editData?.location || '',
    notes: editData?.notes || '',
  });
  
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/exam-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: parseInt(data.courseId),
          examDate: data.examDate.toISOString(),
          location: data.location,
          notes: data.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create exam timetable');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exam-timetable'] });
      toast({
        title: "Success",
        description: "Exam timetable entry created successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!editData) throw new Error("No exam timetable to update");
      
      const response = await fetch(`/api/exam-timetable/${editData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examDate: data.examDate.toISOString(),
          location: data.location,
          notes: data.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update exam timetable');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exam-timetable'] });
      toast({
        title: "Success",
        description: "Exam timetable entry updated successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editData) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!editData && (
        <div>
          <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">
            Course
          </label>
          <select
            id="courseId"
            name="courseId"
            value={formData.courseId}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 p-2"
            required
          >
            <option value="">Select a course</option>
            {enrollments?.map(enrollment => (
              <option key={enrollment.courseId} value={enrollment.courseId}>
                {enrollment.course?.code}: {enrollment.course?.title}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Exam Date
        </label>
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {formData.examDate ? format(formData.examDate, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <CalendarComponent
              mode="single"
              selected={formData.examDate}
              onSelect={(date) => {
                if (date) {
                  setFormData(prev => ({ ...prev, examDate: date }));
                  setDatePickerOpen(false);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <Input
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Exam center, room number, etc."
        />
      </div>
      
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional information about the exam"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {editData ? 'Update' : 'Add'} Exam
        </Button>
      </div>
    </form>
  );
};

const ExamTimetableComponent: React.FC<ExamTimetableProps> = ({ className }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamTimetableType | undefined>(undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ExamTimetableResponse>({
    queryKey: ['/api/exam-timetable'],
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/exam-timetable/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete exam timetable');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exam-timetable'] });
      toast({
        title: "Success",
        description: "Exam timetable entry deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddExam = () => {
    setSelectedExam(undefined);
    setIsDialogOpen(true);
  };

  const handleEditExam = (exam: ExamTimetableType) => {
    setSelectedExam(exam);
    setIsDialogOpen(true);
  };

  const handleDeleteExam = (id: number) => {
    if (window.confirm('Are you sure you want to delete this exam from your timetable?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy');
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold text-forest-800">Exam Timetable</h2>
        </div>
        {[1, 2].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-1/2 mb-1" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const timetables = data?.timetables || [];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold text-forest-800">Exam Timetable</h2>
        <Button onClick={handleAddExam} className="bg-forest-600 hover:bg-forest-700">
          Add Exam
        </Button>
      </div>
      
      {timetables.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-white">
          <Calendar className="h-12 w-12 text-forest-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No exams scheduled</h3>
          <p className="mt-1 text-sm text-gray-500">Add your exam dates to keep track of your schedule</p>
          <Button onClick={handleAddExam} className="mt-4 bg-forest-600 hover:bg-forest-700">
            Add Your First Exam
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {timetables.map(timetable => (
            <Card key={timetable.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 text-forest-600 mr-2" />
                    {timetable.course?.code}: {timetable.course?.title}
                  </CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditExam(timetable)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExam(timetable.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {timetable.course?.faculty} • Level {timetable.course?.level || '100'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 text-gray-500 mr-2" />
                    <span>{formatDate(timetable.examDate)}</span>
                  </div>
                  {timetable.location && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                      <span>{timetable.location}</span>
                    </div>
                  )}
                  {timetable.notes && (
                    <div className="text-sm text-gray-600 mt-2">
                      {timetable.notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedExam ? 'Edit Exam' : 'Add Exam'}</DialogTitle>
          </DialogHeader>
          <ExamEntryForm 
            onClose={() => setIsDialogOpen(false)} 
            editData={selectedExam}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Wrapped with context provider
const ExamTimetable: React.FC<ExamTimetableProps> = (props) => {
  return (
    <UserEnrollmentsProvider>
      <ExamTimetableComponent {...props} />
    </UserEnrollmentsProvider>
  );
};

export default ExamTimetable; 