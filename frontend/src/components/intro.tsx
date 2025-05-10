import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface IntroProps {
    onAddFirstRepo: () => void;
}

export function Intro({ onAddFirstRepo }: IntroProps) {
    return (
        <div className="container mx-auto py-12">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-3xl text-center">Welcome to GitHub CRM</CardTitle>
                    <CardDescription className="text-center text-lg">
                        Your personal GitHub repository manager
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center space-y-4">
                        <p className="text-muted-foreground">
                            Track your GitHub repositories, monitor their performance, and keep everything organized in one place.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="p-4 rounded-lg border">
                                <h3 className="font-semibold mb-2">Monitor Activity</h3>
                                <p className="text-muted-foreground">Track stars, forks, and issues in real-time</p>
                            </div>
                            <div className="p-4 rounded-lg border">
                                <h3 className="font-semibold mb-2">Stay Updated</h3>
                                <p className="text-muted-foreground">Get instant updates on repository changes</p>
                            </div>
                            <div className="p-4 rounded-lg border">
                                <h3 className="font-semibold mb-2">Organize</h3>
                                <p className="text-muted-foreground">Keep all your repositories in one place</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <Button size="lg" onClick={onAddFirstRepo}>
                            Add Your First Repository
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 