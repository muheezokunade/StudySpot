import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  User as UserIcon, 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Award, 
  BarChart3, 
  Share2, 
  Copy, 
  ExternalLink
} from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, RecentProgressItem } from '@/types';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

// Form schema for profile update
const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  programme: z.string().optional(),
  studyCenter: z.string().optional(),
  level: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile: React.FC = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // Get user profile data
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    enabled: !!user,
  });
  
  // Get user progress data
  const { data: progressData, isLoading: isProgressLoading } = useQuery({
    queryKey: ['/api/progress'],
    enabled: !!user,
  });

  // Format progress data for display
  const formatProgressItems = (): RecentProgressItem[] => {
    if (!progressData?.progress) return [];

    return progressData.progress.map(item => {
      let type = 'summary';
      if (item.examId) type = 'exam';
      else if (item.materialId && item.material?.type === 'Quiz') type = 'quiz';

      // Format the timestamp
      const date = new Date(item.timestamp);
      const timeAgo = getTimeAgo(date);

      return {
        id: item.id,
        type,
        title: item.course ? `${item.course.code}: ${item.material?.title || item.exam?.title || 'Activity'}` : 'Course Activity',
        timestamp: timeAgo,
        score: item.score || 0,
        course: item.course?.code
      };
    });
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 3600;
    if (interval > 24) {
      interval = Math.floor(interval / 24);
      return interval === 1 ? 'Yesterday' : `${interval} days ago`;
    }
    if (interval > 1) {
      return `${Math.floor(interval)} hours ago`;
    }
    
    interval = seconds / 60;
    if (interval > 1) {
      return `${Math.floor(interval)} minutes ago`;
    }
    
    return 'Just now';
  };

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest('PUT', '/api/user/profile', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      toast({
        title: 'Profile updated',
        description: 'Your profile information has been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Initialize form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profileData?.profile?.firstName || user?.firstName || '',
      programme: profileData?.profile?.programme || '',
      studyCenter: profileData?.profile?.studyCenter || '',
      level: profileData?.profile?.level || '',
    },
  });

  // Update form values when profile data is loaded
  React.useEffect(() => {
    if (profileData?.profile) {
      form.reset({
        firstName: profileData.profile.firstName,
        programme: profileData.profile.programme || '',
        studyCenter: profileData.profile.studyCenter || '',
        level: profileData.profile.level || '',
      });
    }
  }, [profileData, form]);

  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };

  // Copy referral code to clipboard
  const copyReferralCode = () => {
    if (profileData?.profile?.referralCode) {
      navigator.clipboard.writeText(profileData.profile.referralCode);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Referral code copied to clipboard',
        variant: 'default',
      });
      
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get icon for progress item type
  const getProgressIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <BookOpen className="h-5 w-5 text-forest-600" />;
      case 'exam':
        return <GraduationCap className="h-5 w-5 text-forest-600" />;
      case 'summary':
        return <FileIcon className="h-5 w-5 text-forest-600" />;
      default:
        return <BookOpen className="h-5 w-5 text-forest-600" />;
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    if (!progressData?.progress) return { totalItems: 0, avgScore: 0, completed: 0 };
    
    const totalItems = progressData.progress.length;
    const completedItems = progressData.progress.filter(p => p.completed).length;
    const scores = progressData.progress.filter(p => p.score).map(p => p.score as number);
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) 
      : 0;
    
    return {
      totalItems,
      avgScore,
      completed: completedItems
    };
  };

  const stats = calculateStats();
  const progressItems = formatProgressItems();

  // Generate skeleton loading UI for profile section
  const renderProfileSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      <Skeleton className="h-10 w-32" />
    </div>
  );

  // Generate skeleton loading UI for progress section
  const renderProgressSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      
      <Skeleton className="h-8 w-40 mb-2" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="glass-card p-6 mb-8">
        <h1 className="text-2xl font-bold text-forest-800 mb-2">Your Profile</h1>
        <p className="text-gray-600">Manage your account information and view your progress</p>
      </div>
      
      <div className="glass-card p-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="progress">Learning Progress</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            {isProfileLoading ? (
              renderProfileSkeleton()
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="programme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Programme</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your programme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="computer_science">B.Sc Computer Science</SelectItem>
                                <SelectItem value="business_admin">B.Sc Business Administration</SelectItem>
                                <SelectItem value="economics">B.Sc Economics</SelectItem>
                                <SelectItem value="mass_comm">B.Sc Mass Communication</SelectItem>
                                <SelectItem value="law">LLB Law</SelectItem>
                                <SelectItem value="education">B.Sc Education</SelectItem>
                                <SelectItem value="accounting">B.Sc Accounting</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="studyCenter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Study Centre</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your study centre" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="h-80 overflow-y-auto">
                                <SelectItem value="abakaliki">Abakaliki Study Centre</SelectItem>
                                <SelectItem value="abeokuta_correctional">Abeokuta Correctional Service Study Centre</SelectItem>
                                <SelectItem value="abeokuta">Abeokuta Study Centre</SelectItem>
                                <SelectItem value="abuja_model">Abuja Model Study Centre</SelectItem>
                                <SelectItem value="ado_ekiti">Ado-Ekiti Study Centre</SelectItem>
                                <SelectItem value="akure">Akure Study Centre</SelectItem>
                                <SelectItem value="asaba">Asaba Study Centre</SelectItem>
                                <SelectItem value="asaga">Asaga Community Study Centre</SelectItem>
                                <SelectItem value="awa_ijebu">Awa-Ijebu Community Study Centre</SelectItem>
                                <SelectItem value="awgu">Awgu Community Study Centre</SelectItem>
                                <SelectItem value="awka">Awka Study Centre</SelectItem>
                                <SelectItem value="azare">Azare Community Study Centre</SelectItem>
                                <SelectItem value="badagry">Badagry Study Centre</SelectItem>
                                <SelectItem value="bagwai">Bagwai Study Centre</SelectItem>
                                <SelectItem value="bauchi">Bauchi Study Centre</SelectItem>
                                <SelectItem value="benin">Benin Study Centre</SelectItem>
                                <SelectItem value="bichi">Bichi Study Centre</SelectItem>
                                <SelectItem value="bogoro">Bogoro Community Study Centre</SelectItem>
                                <SelectItem value="calabar">Calabar Study Centre</SelectItem>
                                <SelectItem value="damaturu">Damaturu Study Centre</SelectItem>
                                <SelectItem value="danbatta">Danbatta Study Centre</SelectItem>
                                <SelectItem value="dawakin_kudu">Dawakin Kudu Study Centre</SelectItem>
                                <SelectItem value="dawakin_tofa">Dawakin Tofa Study Centre</SelectItem>
                                <SelectItem value="dutse">Dutse Study Centre</SelectItem>
                                <SelectItem value="emevor">Emevor Community Study Centre</SelectItem>
                                <SelectItem value="enugu">Enugu Study Centre</SelectItem>
                                <SelectItem value="fagge">Fagge Study Centre</SelectItem>
                                <SelectItem value="fugar">Fugar Community Study Centre</SelectItem>
                                <SelectItem value="gabasawa">Gabasawa Study Centre</SelectItem>
                                <SelectItem value="gombe">Gombe Study Centre</SelectItem>
                                <SelectItem value="gulak">Gulak Community Study Centre</SelectItem>
                                <SelectItem value="gusau">Gusau Study Centre</SelectItem>
                                <SelectItem value="gwarzo">Gwarzo Study Centre</SelectItem>
                                <SelectItem value="hadejia">Hadejia Study Centre</SelectItem>
                                <SelectItem value="ibadan">Ibadan Study Centre</SelectItem>
                                <SelectItem value="idah">Idah Community Study Centre</SelectItem>
                                <SelectItem value="ikom">Ikom Community Study Centre</SelectItem>
                                <SelectItem value="ikorodu_model">Ikorodu Model Study Centre</SelectItem>
                                <SelectItem value="ikorodu">Ikorodu Study Centre</SelectItem>
                                <SelectItem value="ilaro">Ilaro Community Study Centre</SelectItem>
                                <SelectItem value="ilesha_correctional">Ilesha Correctional Service Special Study Centre</SelectItem>
                                <SelectItem value="ilorin">Ilorin Study Centre</SelectItem>
                                <SelectItem value="isanlu">Isanlu Community Study Centre</SelectItem>
                                <SelectItem value="isua_akoko">Isua-Akoko Community Study Centre</SelectItem>
                                <SelectItem value="isulo">Isulo Community Study Centre</SelectItem>
                                <SelectItem value="iwo">Iwo Study Centre</SelectItem>
                                <SelectItem value="iyara">Iyara Community Study Centre</SelectItem>
                                <SelectItem value="jalingo">Jalingo Study Centre</SelectItem>
                                <SelectItem value="jos">Jos Study Centre</SelectItem>
                                <SelectItem value="kabo">Kabo Study Centre</SelectItem>
                                <SelectItem value="kaduna_correctional">Kaduna Correctional Service Study Centre</SelectItem>
                                <SelectItem value="kaduna">Kaduna Study Centre</SelectItem>
                                <SelectItem value="kagoro">Kagoro Study Centre</SelectItem>
                                <SelectItem value="kano">Kano Study Centre</SelectItem>
                                <SelectItem value="katsina">Katsina Study Centre</SelectItem>
                                <SelectItem value="kebbi">Kebbi Study Centre</SelectItem>
                                <SelectItem value="kisi">Kisi Community Study Centre</SelectItem>
                                <SelectItem value="kuje_correctional">Kuje Correctional Service Study Centre</SelectItem>
                                <SelectItem value="kunchi">Kunchi Study Centre</SelectItem>
                                <SelectItem value="kwachiri">Kwachiri Study Centre</SelectItem>
                                <SelectItem value="lafia_correctional">Lafia Correctional Service Study Centre</SelectItem>
                                <SelectItem value="lafia">Lafia Study Centre</SelectItem>
                                <SelectItem value="lagos_mainland">Lagos Mainland Study Centre I (Apapa)</SelectItem>
                                <SelectItem value="lagos">Lagos Study Centre (Victoria Island)</SelectItem>
                                <SelectItem value="lokoja">Lokoja Study Centre</SelectItem>
                                <SelectItem value="maiduguri">Maiduguri Study Centre</SelectItem>
                                <SelectItem value="makoda">Makoda Study Centre</SelectItem>
                                <SelectItem value="makurdi">Makurdi Study Centre</SelectItem>
                                <SelectItem value="mani">Mani Community Study Centre</SelectItem>
                                <SelectItem value="masari">Masari Community Study Centre</SelectItem>
                                <SelectItem value="mccarthy">McCarthy Study Centre</SelectItem>
                                <SelectItem value="minna">Minna Study Centre</SelectItem>
                                <SelectItem value="mushin">Mushin Study Centre</SelectItem>
                                <SelectItem value="nurtw_garki">National Union of Road Transport Workers Special Study Centre (Garki Abuja)</SelectItem>
                                <SelectItem value="offa">Offa Community Study Centre</SelectItem>
                                <SelectItem value="ogori">Ogori Community Study Centre</SelectItem>
                                <SelectItem value="oka_akoko">Oka-Akoko Community Study Centre</SelectItem>
                                <SelectItem value="okeho">Okeho Community Study Centre</SelectItem>
                                <SelectItem value="onicha_ugbo">Onicha-Ugbo Study Centre</SelectItem>
                                <SelectItem value="opi">Opi Community Study Centre</SelectItem>
                                <SelectItem value="osogbo">Osogbo Study Centre</SelectItem>
                                <SelectItem value="otan_ayegbaju">Otan-Ayegbaju Community Study Centre</SelectItem>
                                <SelectItem value="otukpo">Otukpo Study Centre</SelectItem>
                                <SelectItem value="owerri">Owerri Study Centre</SelectItem>
                                <SelectItem value="owhrode">Owhrode Community Study Centre</SelectItem>
                                <SelectItem value="patani">Patani Community Study Centre</SelectItem>
                                <SelectItem value="port_harcourt">Port Harcourt Study Centre (Iriebe)</SelectItem>
                                <SelectItem value="rimi_gado">Rimi Gado Study Centre</SelectItem>
                                <SelectItem value="sapele">Sapele Community Study Centre</SelectItem>
                                <SelectItem value="shanono">Shanono Study Centre</SelectItem>
                                <SelectItem value="sokoto">Sokoto Study Centre</SelectItem>
                                <SelectItem value="surulere">Surulere Study Centre</SelectItem>
                                <SelectItem value="tofa">Tofa Study Centre</SelectItem>
                                <SelectItem value="tsanyawa">Tsanyawa Study Centre</SelectItem>
                                <SelectItem value="ugbokolo">Ugbokolo Study Centre</SelectItem>
                                <SelectItem value="umuahia_correctional">Umuahia Correctional Service Study Centre</SelectItem>
                                <SelectItem value="umudike">Umudike Study Centre</SelectItem>
                                <SelectItem value="uromi">Uromi Community Study Centre</SelectItem>
                                <SelectItem value="uyo">Uyo Study Centre</SelectItem>
                                <SelectItem value="wukari">Wukari Study Centre</SelectItem>
                                <SelectItem value="wuse">Wuse II Study Centre</SelectItem>
                                <SelectItem value="yenagoa">Yenagoa Study Centre</SelectItem>
                                <SelectItem value="yola">Yola Study Centre</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="100">100 Level</SelectItem>
                                <SelectItem value="200">200 Level</SelectItem>
                                <SelectItem value="300">300 Level</SelectItem>
                                <SelectItem value="400">400 Level</SelectItem>
                                <SelectItem value="500">500 Level</SelectItem>
                                <SelectItem value="masters_1">Masters Year 1</SelectItem>
                                <SelectItem value="masters_2">Masters Year 2</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="bg-forest-600 hover:bg-forest-700"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? 'Updating...' : 'Save Changes'}
                      </Button>
                    </form>
                  </Form>
                </div>
                
                <div>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Account Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-center mb-4">
                        <div className="bg-forest-100 rounded-full p-6 border-4 border-mint-light">
                          <UserIcon className="h-16 w-16 text-forest-600" />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                        <p className="text-gray-900">{profileData?.profile?.email}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">School</h3>
                        <p className="text-gray-900">{profileData?.profile?.school || 'National Open University of Nigeria'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Subscription</h3>
                        <div className="flex items-center mt-1">
                          <Badge variant={profileData?.profile?.subscription === 'Premium' ? 'default' : 'outline'} className={profileData?.profile?.subscription === 'Premium' ? 'bg-forest-600' : ''}>
                            {profileData?.profile?.subscription || 'Free'}
                          </Badge>
                          {profileData?.profile?.subscription !== 'Premium' && (
                            <Button variant="link" className="text-forest-600 h-auto p-0 ml-2">
                              Upgrade
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {profileData?.profile?.referralCode && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Your Referral Code</h3>
                          <div className="flex items-center">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm mr-2">
                              {profileData.profile.referralCode}
                            </code>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8" 
                              onClick={copyReferralCode}
                            >
                              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Share with friends to earn rewards!
                          </p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      {profileData?.profile?.subscription !== 'Premium' && (
                        <Button className="w-full bg-forest-600 hover:bg-forest-700">
                          Upgrade to Premium
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                  
                  {profileData?.profile?.referralCode && (
                    <Card className="mt-6">
                      <CardHeader className="pb-2">
                        <CardTitle>Agent Dashboard</CardTitle>
                        <CardDescription>Share Noun Success and earn rewards!</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-sm font-medium">Total Referrals</h3>
                            <p className="text-2xl font-semibold text-forest-800">0</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium">Earnings</h3>
                            <p className="text-2xl font-semibold text-forest-800">₦0</p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          className="w-full flex items-center justify-center text-forest-600 border-forest-600 hover:bg-forest-50"
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Share Referral Code
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="progress">
            {isProgressLoading ? (
              renderProgressSkeleton()
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Total Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <BarChart3 className="h-12 w-12 text-forest-600" />
                        <p className="text-3xl font-bold text-forest-800">{stats.totalItems}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Average Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <Award className="h-12 w-12 text-forest-600" />
                        <p className="text-3xl font-bold text-forest-800">{stats.avgScore}%</p>
                      </div>
                      <div className="mt-2">
                        <Progress value={stats.avgScore} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Completed Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <Clock className="h-12 w-12 text-forest-600" />
                        <p className="text-3xl font-bold text-forest-800">{stats.completed}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <h2 className="text-xl font-semibold text-forest-800 mb-4">Recent Activities</h2>
                
                {progressItems.length > 0 ? (
                  <div className="space-y-4">
                    {progressItems.map(item => (
                      <Card key={item.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start">
                              <div className="bg-mint-light p-2 rounded-lg">
                                {getProgressIcon(item.type)}
                              </div>
                              <div className="ml-3">
                                <h3 className="font-medium text-gray-800">{item.title}</h3>
                                <p className="text-sm text-gray-500">{item.timestamp}</p>
                              </div>
                            </div>
                            
                            {item.score > 0 && (
                              <Badge className={`${
                                item.score >= 80 ? 'bg-green-100 text-green-800' : 
                                item.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.score}%
                              </Badge>
                            )}
                          </div>
                          
                          {item.score > 0 && (
                            <div className="mt-3">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className={`${
                                    item.score >= 80 ? 'bg-green-500' : 
                                    item.score >= 60 ? 'bg-yellow-500' : 
                                    'bg-red-500'
                                  } h-2.5 rounded-full`} 
                                  style={{ width: `${item.score}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <GraduationCap className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No Activities Yet</h3>
                      <p className="text-gray-600 mb-4">
                        Start using Noun Success to prepare for exams, read summaries, and track your learning progress.
                      </p>
                      <Button className="bg-forest-600 hover:bg-forest-700">
                        Start Learning
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Custom icons
const FileIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const Check = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default Profile;
