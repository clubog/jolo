import { BEZIRKE } from "../../config/constants";
import { Chip } from "../ui/Chip";

interface Props {
  selected: string[];
  onToggle: (bezirk: string) => void;
}

export function DistrictSelector({ selected, onToggle }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-center">Where do you want to go?</h2>
      <p className="text-center text-text-light text-sm">Pick one or more districts</p>

      <div className="grid grid-cols-2 gap-2">
        {BEZIRKE.map((bezirk) => (
          <Chip
            key={bezirk}
            label={bezirk}
            selected={selected.includes(bezirk)}
            onClick={() => onToggle(bezirk)}
            className="w-full"
          />
        ))}
      </div>
    </div>
  );
}
