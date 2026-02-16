interface Props {
  travelInfo: string;
}

export function TravelConnector({ travelInfo }: Props) {
  return (
    <div className="flex items-center gap-3 py-2 px-6">
      <div className="flex flex-col items-center">
        <div className="w-0.5 h-4 bg-gray-300" />
        <div className="w-2 h-2 rounded-full bg-gray-300" />
        <div className="w-0.5 h-4 bg-gray-300" />
      </div>
      <span className="text-xs text-text-light font-medium">{travelInfo}</span>
    </div>
  );
}
