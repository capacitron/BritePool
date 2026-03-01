'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Mail,
  Copy,
  CheckCircle,
  Lightbulb,
  Target,
  Handshake,
  Clock,
  Link2,
  RotateCcw,
  Ban,
  Hash,
} from 'lucide-react'

interface OutreachTemplatesProps {
  username: string
}

type TabId = 'email' | 'x' | 'ig' | 'tips'

interface TemplateData {
  id: string
  tag: string
  tagStyle: string
  title: string
  subjectLine?: string
  body: string
  note: string
  charCount?: string
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'email', label: 'Email', icon: '📧' },
  { id: 'x', label: 'X / Twitter', icon: '𝕏' },
  { id: 'ig', label: 'Instagram', icon: '📸' },
  { id: 'tips', label: 'Tips', icon: '💡' },
]

function getTemplates(username: string) {
  const link = `https://britepool.org/${username}`

  const emailTemplates: TemplateData[] = [
    {
      id: 'email1',
      tag: 'Warm',
      tagStyle: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'The Personal Invite',
      subjectLine: 'Something crossed my path — thought of you immediately',
      body: `Hey [First Name],

I hope you're doing well! I've been meaning to reach out because I recently connected with a community that's been a real game-changer for me — and honestly, you were one of the first people I thought of.

It's called BRITE POOL — Building Resources Investing Together for Empowerment. It's a ministerium-based collective focused on two things most people are quietly seeking: better health and real wealth.

What drew me in is that it's not just one opportunity or one product. It's a platform designed to help people build a diversified income portfolio — think multiple streams working together — along with healing center projects and community-driven growth. There's governance, education, equity-building through what they call the Sacred Ledger, and a community of 500+ members who are actively investing in each other.

I know you've always been someone who thinks seriously about where you put your time and energy, so I wanted to share this with you directly rather than just post about it.

If you're curious, here's where you can check it out and get started:
👉 ${link}

No pressure at all — just wanted to make sure this landed in front of the right people. I'd love to walk you through it if you want to hop on a quick call.

Talk soon,
[Your Name]`,
      note: "Best for: Close friends, people you've had real conversations with about health or finances, anyone who values personal recommendations over mass messaging.",
    },
    {
      id: 'email2',
      tag: 'Direct',
      tagStyle: 'bg-red-50 text-red-700 border-red-200',
      title: 'The Opportunity Pitch',
      subjectLine: "Health + Wealth under one roof — here's what I found",
      body: `Hey [First Name],

Quick question — are you actively looking to diversify your income right now?

If the answer is even "maybe," I want to put something on your radar.

BRITE POOL is a collective empowerment platform that's helping people build real, diversified income portfolios — not just one stream, but multiple opportunities working together. We're talking crypto-based wealth generation, healing center projects, community equity, and educational resources all in one ecosystem.

Here's why it caught my attention:

• It's community-governed — members actually shape the direction through committees
• There's a built-in equity system (the Sacred Ledger) where your contributions grow
• Over $2M invested collectively, 500+ members, and 12 active committees
• It addresses both health AND wealth — because what good is one without the other?

This is for people who are serious. Serious about their health. Serious about their financial future. Serious about building something alongside like-minded people.

If that sounds like you, take 5 minutes and check this out:
👉 ${link}

Happy to answer any questions — just hit reply.

[Your Name]`,
      note: "Best for: Acquaintances who've expressed interest in side income, entrepreneurship, or financial freedom. People who respond well to clear value propositions.",
    },
    {
      id: 'email3',
      tag: 'Soft',
      tagStyle: 'bg-green-50 text-green-700 border-green-200',
      title: 'The Community-First Intro',
      subjectLine: 'Ever thought about building wealth in community?',
      body: `Hey [First Name],

I've been reflecting lately on how most wealth-building feels so... isolated. Everyone out here grinding alone, guessing which opportunity is real, hoping something sticks.

I found something different and wanted to share it with you.

BRITE POOL (Building Resources Investing Together for Empowerment) is a ministerium of empowerment — a collective where people invest in each other, learn together, and build diversified income streams as a community. They're also developing healing center projects and creating spaces for real personal growth alongside financial growth.

What I love about it is the "together" part. It's not just about the money. It's about being part of something rooted in community, transparency, and shared purpose.

If that resonates, here's the link to explore:
👉 ${link}

Would love to hear your thoughts.

Warmly,
[Your Name]`,
      note: 'Best for: People who are more community-oriented, skeptical of "opportunity" pitches, or who you\'d approach more gently. Great for spiritual/wellness-minded contacts.',
    },
  ]

  const xTemplates: TemplateData[] = [
    {
      id: 'x1',
      tag: 'Hook',
      tagStyle: 'bg-forest-50 text-forest-700 border-forest-200',
      title: 'The Attention Grab',
      body: `Most people choose health OR wealth.

What if you didn't have to pick?

BRITE POOL is building a community where both are the standard — diversified income, healing projects, and collective equity all under one roof.

Serious people only 👉 ${link}`,
      charCount: '~253 characters',
      note: 'Strong opener for general audience. Works well as a standalone post or quote-tweet.',
    },
    {
      id: 'x2',
      tag: 'Story',
      tagStyle: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'The Personal Thread Opener',
      body: `I used to think building wealth meant doing everything alone.

Then I found a collective of 500+ people who invest in each other, build together, and share in the growth.

BRITE POOL changed how I think about money AND community.

Here's what it is 🧵👇`,
      charCount: '~271 characters — follow with thread',
      note:
        "Thread idea: 2/ BRITE POOL = Building Resources Investing Together for Empowerment. It's a ministerium-based platform where you can build a diversified income portfolio. 3/ They're also building healing center projects — because real wealth isn't just financial. 4/ 500+ members. $2M+ invested collectively. 12 committees where YOU help govern the direction. → " +
        link,
    },
    {
      id: 'x3',
      tag: 'Punchy',
      tagStyle: 'bg-red-50 text-red-700 border-red-200',
      title: 'The Short & Direct',
      body: `Building wealth alone is slow.

Building wealth in community is powerful.

BRITE POOL → diversified income, healing projects, collective equity.

${link}`,
      charCount: '~186 characters',
      note: 'Minimal and effective. Great for reposting or when you want something clean.',
    },
    {
      id: 'x4',
      tag: 'Question',
      tagStyle: 'bg-green-50 text-green-700 border-green-200',
      title: 'The Engagement Hook',
      body: `Honest question:

If there was a community that helped you build multiple income streams AND invested in your health and personal growth — would you take it seriously?

That's what BRITE POOL is doing. 500+ members. $2M+ invested together.

DM me or check it out 👉 ${link}`,
      charCount: '~279 characters',
      note: 'Question format drives replies and engagement. Great for building conversation.',
    },
  ]

  const igTemplates: TemplateData[] = [
    {
      id: 'ig1',
      tag: 'Feed Post',
      tagStyle: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'The Full Caption',
      body: `Your health is your wealth. Your wealth supports your health. You can't separate the two — so why do most opportunities only focus on one?

That's exactly why BRITE POOL caught my attention.

BRITE POOL — Building Resources Investing Together for Empowerment — is a community-powered platform helping people build diversified income portfolios, support healing center projects, and grow together with real purpose.

This isn't about chasing one thing and hoping it works. It's about building a foundation — multiple streams, community governance, equity through contribution, and education that actually empowers you.

500+ members. $2M+ invested collectively. 12 committees shaping the future together.

If you're serious about your health AND your wealth, this deserves your attention.

Link in bio or DM me "BRITE" and I'll send you the details 👉

#BritePool #CollectiveProsperity #WealthBuilding #HealthAndWealth #DiversifiedIncome #CommunityEmpowerment #BuildTogether #HealingCenter #FinancialFreedom #Ministerium #SacredLedger #InvestInYourself #MultipleIncomeStreams #EmpowermentJourney`,
      note: 'Image ideas: Clean graphic with "Health + Wealth = Freedom" text overlay, a community gathering photo, or a branded BRITE POOL visual.',
    },
    {
      id: 'ig2',
      tag: 'Stories',
      tagStyle: 'bg-forest-50 text-forest-700 border-forest-200',
      title: 'Story Sequence (3–4 Slides)',
      body: `STORY 1:
"What if one community could support both your health AND your wealth?"
[Use question sticker: "Would you join? YES / TELL ME MORE"]

STORY 2:
"BRITE POOL is a collective empowerment platform — diversified income, healing projects, and community equity. 500+ members strong."
[Use plain background with bold text]

STORY 3:
"This is for people who are SERIOUS. About their health. About their wealth. About building with purpose."
[Use emphasis text or highlight animation]

STORY 4:
"DM me 'BRITE' or tap the link to start your journey 👉"
[Add link sticker → ${link}]`,
      note: 'Pro tip: Use the poll/question stickers to drive engagement before the CTA. Stories with interaction get 2–3x more reach.',
    },
    {
      id: 'ig3',
      tag: 'Carousel',
      tagStyle: 'bg-red-50 text-red-700 border-red-200',
      title: 'Carousel Slide Copy (5 Slides)',
      body: `SLIDE 1 (Cover):
"Stop choosing between HEALTH and WEALTH"
Subtext: There's a better way →

SLIDE 2:
"Meet BRITE POOL"
Building Resources Investing Together for Empowerment
A ministerium-based collective focused on YOUR empowerment

SLIDE 3:
"What you get access to:"
✦ Diversified income portfolio building
✦ Healing center projects
✦ Community governance (12 committees)
✦ Equity through the Sacred Ledger
✦ Courses & resources for personal growth

SLIDE 4:
"The numbers speak:"
500+ Members
$2M+ Invested Collectively
12 Active Committees
Growing since 2024

SLIDE 5 (CTA):
"Ready to build with us?"
Link in bio or DM me "BRITE"
👉 ${link}`,
      note: 'Design tip: Use consistent brand colors (dark background + teal + gold accents). Keep each slide to one key idea. Carousel format gets highest save rates on Instagram.',
    },
  ]

  return { emailTemplates, xTemplates, igTemplates }
}

const HASHTAGS = [
  '#BritePool',
  '#CollectiveProsperity',
  '#WealthBuilding',
  '#HealthAndWealth',
  '#DiversifiedIncome',
  '#CommunityEmpowerment',
  '#BuildTogether',
  '#HealingCenter',
  '#FinancialFreedom',
  '#Ministerium',
  '#SacredLedger',
  '#InvestInYourself',
  '#MultipleIncomeStreams',
  '#EmpowermentJourney',
  '#BuildWealth',
  '#CommunityFirst',
  '#WealthMindset',
  '#HolisticWealth',
]

const TIPS = [
  {
    icon: Target,
    title: 'Personalize Everything',
    body: 'Replace all bracketed [sections] with real details. Mention something specific about the person — a past conversation, shared interest, or their situation. Generic copy gets ignored.',
  },
  {
    icon: Handshake,
    title: 'Lead With Relationship',
    body: "The warm templates outperform direct pitches 3:1 with friends. Save the direct approach for acquaintances who've already shown interest in income opportunities.",
  },
  {
    icon: Clock,
    title: 'Timing Matters',
    body: 'Best email send times: Tue–Thu, 9–11am local. Best X posting: 8–10am and 6–8pm. Best IG posting: 11am–1pm and 7–9pm. Avoid weekends for first outreach.',
  },
  {
    icon: Link2,
    title: 'Always Include the Link',
    body: 'Your referral link should be in every touchpoint. On IG, put it in your bio and mention "link in bio" in captions.',
  },
  {
    icon: RotateCcw,
    title: 'Follow Up',
    body: '80% of conversions happen on follow-up #2–5. If someone doesn\'t respond to email, try a different platform. If they said "interesting," follow up within 48 hours with a call offer.',
  },
  {
    icon: Ban,
    title: "Don't Oversell",
    body: 'Let the platform speak for itself. Your job is to get them to the link. If someone pushes back, respect it — a soft "no pressure, it\'ll be here when you\'re ready" preserves the relationship.',
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        'shrink-0 transition-colors',
        copied
          ? 'bg-forest-600 text-white border-forest-600'
          : 'border-forest-600 text-forest-700 hover:bg-forest-600 hover:text-white'
      )}
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
    >
      {copied ? (
        <>
          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          Copy
        </>
      )}
    </Button>
  )
}

function TemplateCard({ template }: { template: TemplateData }) {
  const copyText = template.subjectLine
    ? `Subject: ${template.subjectLine}\n\n${template.body}`
    : template.body

  return (
    <Card className="border-sand-200 hover:shadow-warm-md transition-shadow">
      <CardHeader className="bg-sand-50 border-b border-sand-200 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn('text-xs font-mono', template.tagStyle)}>
              {template.tag}
            </Badge>
            <CardTitle className="text-sm font-bold text-forest-800 font-body">
              {template.title}
            </CardTitle>
          </div>
          <CopyButton text={copyText} />
        </div>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        {template.subjectLine && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-forest-400 font-mono">
              Subject Line
            </p>
            <div className="px-3 py-2 bg-sand-50 border border-dashed border-sand-300 rounded-lg text-sm font-mono text-forest-800">
              {template.subjectLine}
            </div>
          </div>
        )}
        <div className="text-sm leading-relaxed text-forest-700 font-body whitespace-pre-wrap">
          {template.body}
        </div>
        {template.charCount && (
          <p className="text-xs text-forest-400 font-mono text-right">{template.charCount}</p>
        )}
        <div className="p-3 bg-sand-50 rounded-lg border-l-3 border-sand-300 text-xs text-forest-500 font-body">
          <span className="font-semibold text-forest-700">{template.note.split(':')[0]}:</span>
          {template.note.substring(template.note.indexOf(':') + 1)}
        </div>
      </CardContent>
    </Card>
  )
}

export function OutreachTemplates({ username }: OutreachTemplatesProps) {
  const [activeTab, setActiveTab] = useState<TabId>('email')
  const [hashtagCopied, setHashtagCopied] = useState<string | null>(null)
  const { emailTemplates, xTemplates, igTemplates } = getTemplates(username)

  function copyHashtag(tag: string) {
    navigator.clipboard.writeText(tag)
    setHashtagCopied(tag)
    setTimeout(() => setHashtagCopied(null), 1500)
  }

  function copyAllHashtags() {
    navigator.clipboard.writeText(HASHTAGS.join(' '))
    setHashtagCopied('all')
    setTimeout(() => setHashtagCopied(null), 1500)
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex bg-white border border-sand-200 rounded-xl p-1.5 shadow-warm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold font-body transition-all text-center whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-forest-600 text-white shadow-sm'
                : 'text-forest-400 hover:text-forest-700 hover:bg-sand-50'
            )}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Email Panel */}
      {activeTab === 'email' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-start gap-4 p-5 bg-forest-50 rounded-xl border-l-4 border-forest-600">
            <Mail className="h-6 w-6 text-forest-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-display font-bold text-forest-800">Email Templates</h2>
              <p className="text-sm text-forest-500 font-body mt-1">
                Three approaches — warm personal invite, direct opportunity pitch, and soft
                community-first intro. Personalize the bracketed sections before sending.
              </p>
            </div>
          </div>
          {emailTemplates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}

      {/* X / Twitter Panel */}
      {activeTab === 'x' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-start gap-4 p-5 bg-forest-50 rounded-xl border-l-4 border-forest-600">
            <span className="text-2xl shrink-0">𝕏</span>
            <div>
              <h2 className="text-lg font-display font-bold text-forest-800">
                X (Twitter) Templates
              </h2>
              <p className="text-sm text-forest-500 font-body mt-1">
                Optimized for engagement — short-form posts, thread openers, and quote-tweet-ready
                formats. All under 280 characters where indicated.
              </p>
            </div>
          </div>
          {xTemplates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}

      {/* Instagram Panel */}
      {activeTab === 'ig' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-start gap-4 p-5 bg-forest-50 rounded-xl border-l-4 border-forest-600">
            <span className="text-2xl shrink-0">📸</span>
            <div>
              <h2 className="text-lg font-display font-bold text-forest-800">
                Instagram Templates
              </h2>
              <p className="text-sm text-forest-500 font-body mt-1">
                Captions for feed posts, stories text, and carousel slide copy. Pair with imagery
                that reflects empowerment, community, and growth.
              </p>
            </div>
          </div>
          {igTemplates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}

          {/* Hashtag Bank */}
          <Card className="border-sand-200">
            <CardHeader className="bg-sand-50 border-b border-sand-200 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 text-xs font-mono"
                  >
                    Resource
                  </Badge>
                  <CardTitle className="text-sm font-bold text-forest-800 font-body">
                    Hashtag Bank — Copy & Mix
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-forest-600 text-forest-700 hover:bg-forest-600 hover:text-white"
                  onClick={copyAllHashtags}
                >
                  {hashtagCopied === 'all' ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Copied All!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy All
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex flex-wrap gap-2">
                {HASHTAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => copyHashtag(tag)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-mono transition-all border',
                      hashtagCopied === tag
                        ? 'bg-forest-600 text-white border-forest-600'
                        : 'bg-forest-50 text-forest-700 border-forest-100 hover:bg-forest-600 hover:text-white hover:border-forest-600'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <p className="text-xs text-forest-400 font-body mt-4">
                Use 15–20 hashtags max. Mix broad reach tags (#WealthBuilding) with niche ones
                (#SacredLedger). Put them in the first comment, not the caption, for a cleaner look.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tips Panel */}
      {activeTab === 'tips' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-start gap-4 p-5 bg-forest-50 rounded-xl border-l-4 border-forest-600">
            <Lightbulb className="h-6 w-6 text-forest-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-display font-bold text-forest-800">
                Outreach Best Practices
              </h2>
              <p className="text-sm text-forest-500 font-body mt-1">
                How to use these templates effectively and get real responses from real people.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TIPS.map((tip) => (
              <Card key={tip.title} className="border-sand-200">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-2">
                    <tip.icon className="h-4 w-4 text-forest-600" />
                    <h4 className="text-sm font-bold text-forest-800 font-body">{tip.title}</h4>
                  </div>
                  <p className="text-sm text-forest-500 font-body leading-relaxed">{tip.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
