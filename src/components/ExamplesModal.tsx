// components/ExamplesModal.tsx
"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Image from "next/image";

interface ExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExamplesModal({ isOpen, onClose }: ExamplesModalProps) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-60" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="scale-95 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="ease-in duration-150"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-95 opacity-0"
          >
            <div className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-xl max-w-4xl w-full mx-auto p-6 space-y-4 z-50">
              <Dialog.Title className="text-2xl font-bold text-center">
                Resume Examples
              </Dialog.Title>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center">
                  <Image src="/example1.png" alt="Classic" width={300} height={400} className="rounded-lg mx-auto" />
                  <p className="mt-2 text-sm">Classic</p>
                </div>
                <div className="text-center">
                  <Image src="/example2.png" alt="Modern" width={300} height={400} className="rounded-lg mx-auto" />
                  <p className="mt-2 text-sm">Modern</p>
                </div>
                <div className="text-center">
                  <Image src="/example3.png" alt="Creative" width={300} height={400} className="rounded-lg mx-auto" />
                  <p className="mt-2 text-sm">Creative</p>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
