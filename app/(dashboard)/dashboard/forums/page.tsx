import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { MessageSquare, Users, Briefcase, GraduationCap, Heart, Settings, MessagesSquare } from 'lucide-react'

const categoryIcons: Record<string, React.ElementType> = {
  'general-discussion': MessageSquare,
  'governance': Users,
  'wealth': Briefcase,
  'education': GraduationCap,
  'health': Heart,
  'operations': Settings,
}

export default async function ForumsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const categories = await prisma.forumCategory.findMany({
    include: {
      _count: {
        select: {
          posts: {
            where: { parentId: null }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">
          Community Forums
        </h1>
        <p className="text-earth-brown-light mt-1">
          Connect with fellow members and discuss topics that matter
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const IconComponent = categoryIcons[category.slug] || MessagesSquare
          
          return (
            <Link key={category.id} href={`/dashboard/forums/${category.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-start gap-4">
                  <div className="p-3 rounded-lg bg-earth-light">
                    <IconComponent className="h-6 w-6 text-earth-brown" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {category.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-earth-brown-light">
                    <MessageSquare className="h-4 w-4" />
                    <span>{category._count.posts} topics</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessagesSquare className="h-12 w-12 mx-auto text-earth-brown-light mb-4" />
            <h3 className="text-lg font-medium text-earth-brown-dark">No categories yet</h3>
            <p className="text-earth-brown-light mt-1">
              Forum categories will appear here once they are set up.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
