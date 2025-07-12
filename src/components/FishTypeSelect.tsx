
import { FishType } from '../types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FishTypeSelectProps {
  value?: FishType;
  onValueChange: (value: FishType) => void;
  placeholder?: string;
}

const FishTypeSelect = ({ value, onValueChange, placeholder = "Select fish type" }: FishTypeSelectProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {Object.values(FishType).map((fishType) => (
          <SelectItem key={fishType} value={fishType}>
            {fishType}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default FishTypeSelect;
