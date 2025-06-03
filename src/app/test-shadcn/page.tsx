import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TestShadcnPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>shadcn/ui Test</CardTitle>
            <CardDescription>
              Testing if components work correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
            </div>
            <div className="flex gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                If you can see this properly styled, shadcn/ui is working! 🎉
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
