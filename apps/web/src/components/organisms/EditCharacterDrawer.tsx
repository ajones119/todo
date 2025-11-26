import { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/8bit/drawer';
import { Button as BitButton } from '@/components/ui/8bit/button';
import { Label as BitLabel } from '@/components/ui/8bit/label';
import { Input as BitInput } from '@/components/ui/8bit/input';
import { useUserCharacter, useUpdateCharacter } from '@/api/stats';
import { toast } from 'sonner';

type EditCharacterDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const EditCharacterDrawer = ({ open, onOpenChange }: EditCharacterDrawerProps) => {
  const { data: character } = useUserCharacter();
  const updateCharacter = useUpdateCharacter();
  const [name, setName] = useState('');

  // Update local state when character data changes or drawer opens
  useEffect(() => {
    if (open && character) {
      setName(character.name || '');
    }
  }, [open, character]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Character name cannot be empty');
      return;
    }

    try {
      await updateCharacter.mutateAsync({ name: name.trim() });
      toast.success('Character name updated!');
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update character';
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    // Reset to original value
    setName(character?.name || '');
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="bottom" className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Edit Character</DrawerTitle>
          <DrawerDescription>
            Update your character&apos;s name in Pinegate Village.
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
          <div className="space-y-2">
            <BitLabel htmlFor="character-name">Character Name</BitLabel>
            <BitInput
              id="character-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter character name"
              disabled={updateCharacter.isPending}
            />
            {character?.level && (
              <p className="text-xs text-muted-foreground">
                Level: {character.level} {character.title && `• ${character.title}`}
              </p>
            )}
          </div>
        </div>
        
        <DrawerFooter>
          <div className="flex gap-3">
            <BitButton 
              variant="secondary" 
              onClick={handleCancel}
              disabled={updateCharacter.isPending}
            >
              Cancel
            </BitButton>
            <BitButton 
              onClick={handleSave}
              disabled={updateCharacter.isPending || !name.trim()}
            >
              {updateCharacter.isPending ? 'Saving...' : 'Save'}
            </BitButton>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

