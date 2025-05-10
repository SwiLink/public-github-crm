import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface AddRepoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (path: string) => void;
    isLoading?: boolean;
}

export function AddRepoModal({ isOpen, onClose, onAdd, isLoading }: AddRepoModalProps) {
    const [repoPath, setRepoPath] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!repoPath) return;
        onAdd(repoPath);
        setRepoPath("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Repository</DialogTitle>
                    <DialogDescription>
                        Enter the repository path in the format: owner/repository
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="py-4">
                        <Input
                            placeholder="e.g., facebook/react"
                            value={repoPath}
                            onChange={(e) => setRepoPath(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !repoPath}>
                            {isLoading ? "Adding..." : "Add Repository"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 