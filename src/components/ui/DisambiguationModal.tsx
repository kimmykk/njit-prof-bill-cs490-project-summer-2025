import React from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "./button";

interface Country {
  code: string;
  label: string;
  emoji: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  countries: Country[];
  onSelect: (country: Country) => void;
}

export const DisambiguationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  countries,
  onSelect,
}) => {
  // Split United States and others
  const unitedStates = countries.find(
    (c) => c.code === "+1" && c.label === "United States"
  );
  const otherCountries = countries.filter(
    (c) => !(c.code === "+1" && c.label === "United States")
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      {/* Modal Panel */}
      <Dialog.Panel className="bg-white dark:bg-zinc-800 p-6 rounded shadow-lg z-10 max-w-lg w-full space-y-4">
        <Dialog.Title className="text-lg font-semibold">
          Select Country
        </Dialog.Title>
        <p className="text-sm text-muted-foreground">
          Multiple countries use this area code. Please select the correct country:
        </p>

        <div className="space-y-4">
          {unitedStates && (
            <button
              onClick={() => onSelect(unitedStates)}
              className="w-full py-4 px-6 border border-blue-600 text-blue-600 font-semibold rounded-lg flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition"
            >
              <span>
                {unitedStates.emoji} {unitedStates.label} ({unitedStates.code})
              </span>
              <span className="text-sm text-blue-500">Primary</span>
            </button>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
            {otherCountries.map((country) => (
              <button
                key={`${country.code}-${country.label}`}
                onClick={() => onSelect(country)}
                className="w-full py-2 px-3 border border-gray-300 dark:border-zinc-700 rounded-md text-left hover:bg-gray-50 dark:hover:bg-zinc-700 transition"
              >
                {country.emoji} {country.label} ({country.code})
              </button>
            ))}
          </div>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full mt-2"
          >
            Cancel
          </Button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};
