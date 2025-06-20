import { Metadata } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { Badge } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Star,
  Filter,
  Search,
  Plus,
  ExternalLink,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community Events | 209jobs',
  description:
    'Discover networking events, workshops, and career development opportunities in the Central Valley',
};

export default function CommunityEventsPage() {
  const events = [
    {
      id: 1,
      title: 'Central Valley Tech Meetup',
      description:
        'Join local tech professionals for networking, presentations, and discussions about the growing tech scene in the Central Valley.',
      date: '2024-03-15',
      time: '6:00 PM - 9:00 PM',
      location: 'Stockton Chamber of Commerce',
      address: '445 W Weber Ave, Stockton, CA 95203',
      organizer: 'CV Tech Community',
      organizerAvatar: '/placeholder-avatar.jpg',
      attendees: 47,
      maxAttendees: 80,
      price: 'Free',
      category: 'Networking',
      featured: true,
      tags: ['Technology', 'Networking', 'Innovation'],
    },
    {
      id: 2,
      title: 'Healthcare Professionals Network',
      description:
        'Monthly gathering for healthcare professionals to discuss industry trends, career opportunities, and professional development.',
      date: '2024-03-20',
      time: '7:00 PM - 9:00 PM',
      location: 'Modesto Regional Medical Center',
      address: '1441 Florida Ave, Modesto, CA 95350',
      organizer: 'Healthcare Network CV',
      organizerAvatar: '/placeholder-avatar.jpg',
      attendees: 23,
      maxAttendees: 40,
      price: 'Members Only',
      category: 'Industry Meetup',
      featured: false,
      tags: ['Healthcare', 'Professional Development', 'Networking'],
    },
    {
      id: 3,
      title: 'Young Professionals Mixer',
      description:
        'Networking event for professionals under 35. Includes appetizers, drinks, and structured networking activities.',
      date: '2024-03-25',
      time: '5:30 PM - 8:30 PM',
      location: 'Downtown Tracy Event Center',
      address: '333 Central Ave, Tracy, CA 95376',
      organizer: 'YP Central Valley',
      organizerAvatar: '/placeholder-avatar.jpg',
      attendees: 62,
      maxAttendees: 100,
      price: '$15',
      category: 'Social',
      featured: true,
      tags: ['Young Professionals', 'Networking', 'Social'],
    },
    {
      id: 4,
      title: 'Resume Writing Workshop',
      description:
        'Learn how to craft a compelling resume that stands out to employers. Includes hands-on exercises and personalized feedback.',
      date: '2024-03-28',
      time: '10:00 AM - 12:00 PM',
      location: 'Manteca Public Library',
      address: '320 W Center St, Manteca, CA 95336',
      organizer: 'Career Development Center',
      organizerAvatar: '/placeholder-avatar.jpg',
      attendees: 18,
      maxAttendees: 25,
      price: '$25',
      category: 'Workshop',
      featured: false,
      tags: ['Career Development', 'Resume', 'Skills'],
    },
    {
      id: 5,
      title: 'Agriculture Innovation Summit',
      description:
        'Explore the latest innovations in agriculture technology and sustainable farming practices. Network with industry leaders.',
      date: '2024-04-02',
      time: '8:00 AM - 5:00 PM',
      location: 'UC Merced Conference Center',
      address: '5200 Lake Rd, Merced, CA 95343',
      organizer: 'AgTech Central Valley',
      organizerAvatar: '/placeholder-avatar.jpg',
      attendees: 89,
      maxAttendees: 150,
      price: '$75',
      category: 'Conference',
      featured: true,
      tags: ['Agriculture', 'Innovation', 'Technology', 'Sustainability'],
    },
    {
      id: 6,
      title: 'Interview Skills Bootcamp',
      description:
        'Intensive workshop covering interview preparation, common questions, and presentation skills. Includes mock interviews.',
      date: '2024-04-05',
      time: '9:00 AM - 4:00 PM',
      location: 'Turlock Community Center',
      address: '818 S Minaret Ave, Turlock, CA 95380',
      organizer: 'Career Success Institute',
      organizerAvatar: '/placeholder-avatar.jpg',
      attendees: 12,
      maxAttendees: 20,
      price: '$50',
      category: 'Workshop',
      featured: false,
      tags: ['Interview Skills', 'Career Development', 'Professional Skills'],
    },
  ];

  const categories = [
    'All',
    'Networking',
    'Workshop',
    'Conference',
    'Social',
    'Industry Meetup',
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Community Events
        </h1>
        <p className="text-gray-600">
          Discover networking events, workshops, and career development
          opportunities in the Central Valley
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button asChild>
            <Link href="/community/events/create">
              <Plus className="mr-2 h-4 w-4" />
              Host Event
            </Link>
          </Button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map(category => (
          <Badge
            key={category}
            variant={category === 'All' ? 'default' : 'secondary'}
            className="cursor-pointer hover:bg-blue-100"
          >
            {category}
          </Badge>
        ))}
      </div>

      {/* Featured Events */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Featured Events</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {events
            .filter(event => event.featured)
            .map(event => (
              <Card key={event.id} className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge className="mb-2">{event.category}</Badge>
                    <Badge variant="secondary">Featured</Badge>
                  </div>
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>
                        {event.attendees}/{event.maxAttendees} attending
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {event.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={event.organizerAvatar} />
                        <AvatarFallback>{event.organizer[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600">
                        {event.organizer}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-green-600">
                        {event.price}
                      </span>
                      <Button size="sm">RSVP</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* All Events */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">All Events</h2>
        <div className="space-y-4">
          {events.map(event => (
            <Card key={event.id} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 lg:flex-row">
                  <div className="flex-1">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {event.category}
                        </Badge>
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                      </div>
                      {event.featured && (
                        <Badge variant="secondary">Featured</Badge>
                      )}
                    </div>

                    <p className="mb-3 text-sm text-gray-600">
                      {event.description}
                    </p>

                    <div className="mb-3 grid grid-cols-1 gap-2 text-sm text-gray-500 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>
                          {event.attendees}/{event.maxAttendees}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-1">
                      {event.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={event.organizerAvatar} />
                        <AvatarFallback>{event.organizer[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600">
                        Organized by {event.organizer}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between gap-2">
                    <span className="text-lg font-semibold text-green-600">
                      {event.price}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Details
                      </Button>
                      <Button size="sm">RSVP</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Load More */}
      <div className="mt-8 text-center">
        <Button variant="outline" size="lg">
          Load More Events
        </Button>
      </div>

      {/* Host Event CTA */}
      <Card className="mt-12 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Host Your Own Event
            </h2>
            <p className="mb-6 text-gray-600">
              Share your expertise and connect with the Central Valley community
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/community/events/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/community/events/guidelines">
                  Event Guidelines
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
