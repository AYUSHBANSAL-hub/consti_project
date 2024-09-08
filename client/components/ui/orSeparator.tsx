import { Separator } from "./separator";

export default function OrSeparator() {
  return (
    <div className="relative flex items-center self-stretch">
      <Separator className="flex-1" />
      <span className="mx-4 text-gray-500">Or</span>
      <Separator className="flex-1" />
    </div>
  );
}
