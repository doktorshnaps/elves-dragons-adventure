import { useEffect } from 'react';

const BASE_TITLE = 'ElleonorAI - Dragon & Heroes | NFT Fantasy Card Game on NEAR';
const BASE_DESCRIPTION = 'ElleonorAI - Заработай играя в NFT карточную игру на NEAR Protocol. Собирай героев и драконов, сражайся в подземельях, обменивай карты.';

interface PageMeta {
  title?: string;
  description?: string;
}

export const usePageTitle = (title?: string) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} | ElleonorAI`;
    } else {
      document.title = BASE_TITLE;
    }
    
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
};

export const usePageMeta = ({ title, description }: PageMeta) => {
  useEffect(() => {
    // Set title
    if (title) {
      document.title = `${title} | ElleonorAI`;
    } else {
      document.title = BASE_TITLE;
    }
    
    // Set description
    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.setAttribute('name', 'description');
      document.head.appendChild(descTag);
    }
    descTag.setAttribute('content', description || BASE_DESCRIPTION);
    
    return () => {
      document.title = BASE_TITLE;
      if (descTag) {
        descTag.setAttribute('content', BASE_DESCRIPTION);
      }
    };
  }, [title, description]);
};
