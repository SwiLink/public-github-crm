import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { Intro } from "@/components/intro";
import { AddRepoModal } from "@/components/add-repo-modal";

interface Repository {
  _id: string;
  owner: string;
  name: string;
  fullName: string;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  createdAt: number;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export function Dashboard() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [repoToDelete, setRepoToDelete] = useState<Repository | null>(null);

  const { data: repositories, isLoading } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: async () => {
      const response = await api.get("/repositories");
      return response.data;
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const addRepoMutation = useMutation({
    mutationFn: async (path: string) => {
      const response = await api.post("/repositories", { path });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
      setIsModalOpen(false);
      toast({
        title: "Success",
        description: "Repository added successfully",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add repository",
        variant: "destructive",
      });
    },
  });

  const refreshRepoMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/repositories/${id}/refresh`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
      toast({
        title: "Success",
        description: "Repository refreshed",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Failed to refresh repository",
        variant: "destructive",
      });
    },
  });

  const deleteRepoMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/repositories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
      toast({
        title: "Success",
        description: "Repository deleted successfully",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Failed to delete repository",
        variant: "destructive",
      });
    },
  });

  const filteredRepositories = repositories?.filter((repo) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      repo.name.toLowerCase().includes(searchLower) ||
      repo.owner.toLowerCase().includes(searchLower)
    );
  });

  const handleDeleteClick = (repo: Repository) => {
    setRepoToDelete(repo);
  };

  const handleDeleteConfirm = () => {
    if (repoToDelete) {
      deleteRepoMutation.mutate(repoToDelete._id);
      setRepoToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setRepoToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading repositories...</div>
        </div>
      </div>
    );
  }

  if (!repositories?.length) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-end mb-8">
          <Button variant="outline" onClick={() => logout()}>
            Logout
          </Button>
        </div>
        <Intro onAddFirstRepo={() => setIsModalOpen(true)} />
        <AddRepoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={(path) => addRepoMutation.mutate(path)}
          isLoading={addRepoMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">GitHub Repositories</h1>
        <div className="flex gap-4">
          <Input
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Button onClick={() => setIsModalOpen(true)}>Add Repository</Button>
          <Button variant="outline" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRepositories?.map((repo) => (
          <Card key={repo._id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{repo.name}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshRepoMutation.mutate(repo._id)}
                    disabled={refreshRepoMutation.isPending}
                  >
                    {refreshRepoMutation.isPending
                      ? "Refreshing..."
                      : "Refresh"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(repo)}
                    disabled={deleteRepoMutation.isPending}
                  >
                    {deleteRepoMutation.isPending ? "Deleting..." : "Delete"}
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
                  {repo.fullName}
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
                    {repo.createdAt
                      ? new Date(repo.createdAt).toUTCString()
                      : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddRepoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={(path) => addRepoMutation.mutate(path)}
        isLoading={addRepoMutation.isPending}
      />

      <AlertDialog open={!!repoToDelete} onOpenChange={handleDeleteCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the repository "{repoToDelete?.name}"
              from your tracking list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
