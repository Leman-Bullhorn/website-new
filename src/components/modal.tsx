import { Modal as DaisyModal, type ModalProps } from "react-daisyui";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const Modal = (props: ModalProps & { onClose?: () => void }) => {
  const { onClose, ...modalProps } = props;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (modalProps.open && e.key === "Escape") onClose?.();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose?.();
    };
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  });

  useEffect(() => {
    if (modalProps.open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [modalProps.open]);

  return (
    <Portal>
      <DaisyModal
        ref={ref}
        className={`overflow-x-hidden ${modalProps.className}`}
        {...modalProps}
      >
        {modalProps.children}
      </DaisyModal>
    </Portal>
  );
};

Modal.Header = DaisyModal.Header;
Modal.Body = DaisyModal.Body;
Modal.Actions = DaisyModal.Actions;

export default Modal;

const createWrapperAndAppendToBody = (wrapperId: string) => {
  const wrapperElement = document.createElement("div");
  wrapperElement.setAttribute("id", wrapperId);
  document.body.appendChild(wrapperElement);
  return wrapperElement;
};

interface PortalProps {
  children: React.ReactNode;
  wrapperId?: string;
}

const Portal = ({
  children,
  wrapperId = "react-portal-wrapper",
}: PortalProps) => {
  const [wrapperElement, setWrapperElement] = useState<HTMLElement>();

  useEffect(() => {
    let element = document.getElementById(wrapperId);
    let systemCreated = false;
    // if element is not found with wrapperId or wrapperId is not provided,
    // create and append to body
    if (!element) {
      systemCreated = true;
      element = createWrapperAndAppendToBody(wrapperId);
    }
    setWrapperElement(element);

    return () => {
      if (systemCreated && element?.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, [wrapperId]);

  // wrapperElement state will be null on the very first render.
  if (wrapperElement == null) return null;

  return createPortal(children, wrapperElement);
};
