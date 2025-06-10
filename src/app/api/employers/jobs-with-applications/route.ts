import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'employer' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = (session.user as any).id;

    // Fetch jobs with their applications
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        company,
        location,
        applications (
          id,
          status,
          applied_at,
          users (
            id,
            name,
            email,
            skills
          )
        )
      `)
      .eq('employer_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }

    // Transform the data to match our interface
    const transformedJobs = (jobs || []).map(job => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      applications: (job.applications || []).map((app: any) => ({
        id: app.id,
        status: app.status,
        appliedAt: app.applied_at,
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
        },
        user: {
          id: app.users.id,
          name: app.users.name,
          email: app.users.email,
          skills: app.users.skills || [],
        },
      })),
    }));

    return NextResponse.json({ jobs: transformedJobs });
  } catch (error) {
    console.error('Error in jobs-with-applications API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
