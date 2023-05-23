import { type HTMLAttributes, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/tw";

const Modal = (
  props: HTMLAttributes<HTMLDivElement> & {
    open: boolean;
    onClose?: () => void;
  }
) => {
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

    return () => void (document.body.style.overflow = "unset");
  }, [modalProps.open]);

  return (
    <Portal>
      <div
        aria-modal="true"
        aria-label="Modal"
        aria-hidden={!modalProps.open}
        className={cn("modal ", modalProps.open ? "modal-open" : "")}
      >
        <div
          className={cn("modal-box overflow-x-hidden", modalProps.className)}
          ref={ref}
          {...modalProps}
        >
          {modalProps.children}
        </div>
      </div>
    </Portal>
  );
};

type Props = React.PropsWithChildren<HTMLAttributes<HTMLDivElement>>;
function Header({ className, ...props }: Props) {
  return <div className={cn("mb-8 w-full text-xl", className)} {...props} />;
}
function Body(props: Props) {
  return <div {...props} />;
}
function Actions({ className, ...props }: Props) {
  return <div className={cn("modal-action", className)} {...props} />;
}
Modal.Header = Header;
Modal.Body = Body;
Modal.Actions = Actions;

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
