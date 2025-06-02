"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
} from "@/components/ui/context-menu";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
} from "@/components/ui/menubar";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Calendar } from "@/components/ui/calendar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
// Table component not available yet
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ComponentsDemoPage() {
  const [sliderValue, setSliderValue] = React.useState([33]);
  const [switchChecked, setSwitchChecked] = React.useState(false);
  const [checkboxChecked, setCheckboxChecked] = React.useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl font-display">
            UI Components Demo
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Explore our comprehensive collection of UI components
          </p>
        </header>

        {/* Button Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Button</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </section>

        {/* Input Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Input</h2>
          <div className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" placeholder="Email" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input type="password" id="password" placeholder="Password" />
            </div>
            <div>
              <Label htmlFor="textarea">Message</Label>
              <Textarea id="textarea" placeholder="Type your message here." />
            </div>
          </div>
        </section>

        {/* Card Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Card</h2>
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card Description</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card content goes here.</p>
            </CardContent>
            <CardFooter>
              <Button>Action</Button>
            </CardFooter>
          </Card>
        </section>

        {/* Checkbox and Switch Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Checkbox & Switch</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="demo-checkbox" 
                checked={checkboxChecked}
                onCheckedChange={(checked) => setCheckboxChecked(checked === true)}
              />
              <Label htmlFor="demo-checkbox">Accept terms and conditions</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="demo-switch" 
                checked={switchChecked}
                onCheckedChange={setSwitchChecked}
              />
              <Label htmlFor="demo-switch">Enable notifications</Label>
            </div>
          </div>
        </section>

        {/* Slider Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Slider</h2>
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Volume</Label>
                <span className="text-sm text-muted-foreground">{sliderValue[0]}%</span>
              </div>
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Badge Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Badge</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        {/* Avatar Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Avatar</h2>
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </section>

        {/* Progress Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Progress</h2>
          <div className="max-w-md">
            <Progress value={33} className="w-full" />
          </div>
        </section>

        {/* Tabs Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Tabs</h2>
          <Tabs defaultValue="account" className="w-96">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="Pedro Duarte" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" defaultValue="@peduarte" />
              </div>
            </TabsContent>
            <TabsContent value="password" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current password</Label>
                <Input id="current" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New password</Label>
                <Input id="new" type="password" />
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Accordion Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Accordion</h2>
          <Accordion type="single" collapsible className="w-96">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>
                Yes. It adheres to the WAI-ARIA design pattern.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it styled?</AccordionTrigger>
              <AccordionContent>
                Yes. It comes with default styles that match the other components.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Select Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Select</h2>
          <Select>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="blueberry">Blueberry</SelectItem>
              <SelectItem value="grapes">Grapes</SelectItem>
              <SelectItem value="pineapple">Pineapple</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {/* Radio Group Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Radio Group</h2>
          <RadioGroup defaultValue="comfortable">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="default" id="r1" />
              <Label htmlFor="r1">Default</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="comfortable" id="r2" />
              <Label htmlFor="r2">Comfortable</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="compact" id="r3" />
              <Label htmlFor="r3">Compact</Label>
            </div>
          </RadioGroup>
        </section>

        {/* Toggle Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Toggle</h2>
          <div className="flex gap-2">
            <Toggle aria-label="Toggle italic">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.67494 3.50017C5.67494 3.25164 5.87641 3.05017 6.12494 3.05017H10.6249C10.8735 3.05017 11.0749 3.25164 11.0749 3.50017C11.0749 3.7487 10.8735 3.95017 10.6249 3.95017H9.00587L7.2309 11.05H8.87493C9.12345 11.05 9.32493 11.2515 9.32493 11.5C9.32493 11.7486 9.12345 11.95 8.87493 11.95H4.37493C4.1264 11.95 3.92493 11.7486 3.92493 11.5C3.92493 11.2515 4.1264 11.05 4.37493 11.05H5.99397L7.76894 3.95017H6.12494C5.87641 3.95017 5.67494 3.7487 5.67494 3.50017Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Toggle>
            <Toggle aria-label="Toggle bold">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.10505 12C4.70805 12 4.4236 11.912 4.25171 11.736C4.0839 11.5559 4 11.2715 4 10.8827V4.11733C4 3.72033 4.08595 3.43588 4.25784 3.26398C4.43383 3.08799 4.71623 3 5.10505 3C6.42741 3 8.25 3 9.02852 3C10.1373 3 11.0539 3.98153 11.0539 5.1846C11.0539 6.08501 10.6037 6.81855 9.70292 7.23602C10.8657 7.44851 11.5 8.35242 11.5 9.26604C11.5 10.7027 10.2886 12 8.98729 12H5.10505ZM8.51665 6.842C9.18095 6.842 9.74722 6.43821 9.74722 5.80766C9.74722 5.17711 9.18095 4.77332 8.51665 4.77332H6.734V6.842H8.51665ZM8.65342 10.1732C9.4139 10.1732 9.97635 9.73577 9.97635 9.06842C9.97635 8.40108 9.4139 7.96365 8.65342 7.96365H6.734V10.1732H8.65342Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Toggle>
          </div>
        </section>

        {/* Alert Dialog Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Alert Dialog</h2>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Show Dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

        {/* Calendar Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Calendar</h2>
          <Calendar mode="single" className="rounded-md border w-fit" />
        </section>

        {/* Aspect Ratio Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Aspect Ratio</h2>
          <div className="w-96">
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-md">
              <img
                src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
                alt="Photo by Drew Beamer"
                className="rounded-md object-cover w-full h-full"
              />
            </AspectRatio>
          </div>
        </section>

        {/* Separator Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Separator</h2>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">Horizontal Separator</h4>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground">
                This is a horizontal separator.
              </p>
            </div>
            <div className="flex h-16 items-center space-x-4 text-sm">
              <div>Blog</div>
              <Separator orientation="vertical" />
              <div>Docs</div>
              <Separator orientation="vertical" />
              <div>Source</div>
            </div>
          </div>
        </section>

        {/* Skeleton Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Skeleton</h2>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </section>

        {/* Scroll Area Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Scroll Area</h2>
          <ScrollArea className="h-72 w-48 rounded-md border">
            <div className="p-4">
              <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
              {Array.from({ length: 50 }).map((_, i) => (
                <div key={i} className="text-sm mb-2">
                  Tag {i + 1}
                </div>
              ))}
            </div>
          </ScrollArea>
        </section>

        {/* Tooltip Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Tooltip</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add to library</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </section>

        {/* Color Accents Example */}
        <section>
          <h2 className="text-xl font-semibold mb-2 font-display">Color Accents</h2>
          <div className="flex flex-wrap gap-4 font-sans">
            <span className="px-4 py-2 rounded-xl bg-green-500 text-white shadow">Success</span>
            <span className="px-4 py-2 rounded-xl bg-yellow-500 text-white shadow">Warning</span>
            <span className="px-4 py-2 rounded-xl bg-blue-500 text-white shadow">Info</span>
            <span className="px-4 py-2 rounded-xl bg-purple-500 text-white shadow">Highlight</span>
            <span className="px-4 py-2 rounded-xl bg-red-500 text-white shadow">Error</span>
          </div>
        </section>
      </div>
    </main>
  );
}
