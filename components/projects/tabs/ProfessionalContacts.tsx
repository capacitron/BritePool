'use client'

import type { ProfessionalContact } from '@/lib/projects/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Contact } from 'lucide-react'

interface ProfessionalContactsProps {
  contacts: ProfessionalContact[]
}

export function ProfessionalContacts({ contacts }: ProfessionalContactsProps) {
  return (
    <Card className="border-sand-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-forest-800">
          <Contact className="h-5 w-5 text-forest-600" />
          Professional Contacts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-sm text-bark/60 font-body py-8 text-center">
            No professional contacts have been added to this project yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-forest-700">Name</TableHead>
                  <TableHead className="font-semibold text-forest-700">Organization</TableHead>
                  <TableHead className="font-semibold text-forest-700">Role</TableHead>
                  <TableHead className="font-semibold text-forest-700">Email</TableHead>
                  <TableHead className="font-semibold text-forest-700">Phone</TableHead>
                  <TableHead className="font-semibold text-forest-700">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium font-body">{contact.name}</TableCell>
                    <TableCell className="font-body">{contact.organization}</TableCell>
                    <TableCell className="font-body">{contact.role}</TableCell>
                    <TableCell className="font-body">
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-earth-500 hover:text-earth-600"
                        >
                          {contact.email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="font-body">{contact.phone || '—'}</TableCell>
                    <TableCell className="font-body text-bark/60">{contact.notes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
