import { useEffect, useState } from 'react';

export const useSubmitButton = (isConfirmStep: boolean) => {
  const [isSubmitButtonDisable, setIsSubmitButtonDisable] = useState(true);
  const [isAdditionalTextVisible, setIsAdditionalTextVisible] = useState(true);

  useEffect(() => {
    if (!isConfirmStep) return;

    const layoutContentContainer = document.querySelector('#ms-container');

    // if the content is not scrollable, we can enable the submit button
    if (
      layoutContentContainer &&
      layoutContentContainer.clientHeight ===
        layoutContentContainer.scrollHeight
    ) {
      setIsSubmitButtonDisable(false);
      setIsAdditionalTextVisible(false);
    }

    const handleScroll = () => {
      if (layoutContentContainer) {
        const bottom =
          Math.ceil(
            layoutContentContainer.clientHeight +
              layoutContentContainer.scrollTop
          ) >= layoutContentContainer.scrollHeight;

        if (bottom) {
          setIsSubmitButtonDisable(false);
          setIsAdditionalTextVisible(false);
        }
      }
    };

    // add event listener to the scrollable container
    layoutContentContainer?.addEventListener('scroll', handleScroll);

    // remove event listener on cleanup
    return () => {
      layoutContentContainer?.removeEventListener('scroll', handleScroll);
    };
  }, [isConfirmStep]);

  return {
    isSubmitButtonDisable,
    setIsSubmitButtonDisable,
    isAdditionalTextVisible
  };
};
