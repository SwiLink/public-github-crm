import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

interface Repository {
    id: string;
    owner: string;
    name: string;
    url: string;
    stars: number;
    forks: number;
    openIssues: number;
    createdAt: number;
}

export function Dashboard() {
    const { logout } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [repoPath, setRepoPath] = useState('');

    const { data: repositories, isLoading } = useQuery<Repository[]>({
        queryKey: ['repositories'],
        queryFn: async () => {
            const response = await api.get('/repositories');
            return response.data;
        },
        refetchInterval: 5000,
        refetchIntervalInBackground: true,
    });

    const addRepoMutation = useMutation({
        mutationFn: async (path: string) => {
            const response = await api.post('/repositories', { path });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repositories'] });
            setRepoPath('');
            toast({
                title: 'Success',
                description: 'Repository added successfully',
            });
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Failed to add repository',
                variant: 'destructive',
            });
        },
    });

    const refreshRepoMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/repositories/${id}/refresh`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repositories'] });
            toast({
                title: 'Success',
                description: 'Repository refresh queued',
            });
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Failed to refresh repository',
                variant: 'destructive',
            });
        },
    });

    const deleteRepoMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/repositories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repositories'] });
            toast({
                title: 'Success',
                description: 'Repository deleted successfully',
            });
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Failed to delete repository',
                variant: 'destructive',
            });
        },
    });

    async function handleAddRepo(e: React.FormEvent) {
        e.preventDefault();
        if (!repoPath) return;
        addRepoMutation.mutate(repoPath);
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">GitHub Repositories</h1>
                <Button variant="outline" onClick={() => logout()}>
                    Logout
                </Button>
            </div>

            <form onSubmit={handleAddRepo} className="mb-8">
                <div className="flex gap-4">
                    <Input
                        placeholder="Enter repository path (e.g., facebook/react)"
                        value={repoPath}
                        onChange={(e) => setRepoPath(e.target.value)}
                        disabled={addRepoMutation.isPending}
                    />
                    <Button type="submit" disabled={addRepoMutation.isPending}>
                        {addRepoMutation.isPending ? 'Adding...' : 'Add Repository'}
                    </Button>
                </div>
            </form>

            {isLoading ? (
                <div>Loading repositories...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {repositories?.map((repo) => (
                        <Card key={repo.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{repo.name}</span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => refreshRepoMutation.mutate(repo.id)}
                                            disabled={refreshRepoMutation.isPending}
                                        >
                                            Refresh
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => deleteRepoMutation.mutate(repo.id)}
                                            disabled={deleteRepoMutation.isPending}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </CardTitle>
                                <CardDescription>
                                    <a
                                        href={repo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        {repo.owner}/{repo.name}
                                    </a>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Stars</p>
                                        <p className="text-lg font-semibold">{repo.stars}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Forks</p>
                                        <p className="text-lg font-semibold">{repo.forks}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Open Issues</p>
                                        <p className="text-lg font-semibold">{repo.openIssues}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Created</p>
                                        <p className="text-lg font-semibold">
                                            {new Date(repo.createdAt).toUTCString()}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
} 