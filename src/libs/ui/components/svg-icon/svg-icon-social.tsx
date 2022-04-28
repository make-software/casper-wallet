import React from 'react';
import styled from 'styled-components';
import { BaseProps, Link, SvgIcon } from '@src/libs/ui';

const getSocialMediaColor = (type: SocialMediaType) => {
  return {
    keybase: '#EA773A',
    telegram: '#0088CC',
    twitter: '#1DA1F2',
    github: '#333333',
    youtube: '#FF0000',
    facebook: '#4267B2',
    medium: '#00AB6C',
    reddit: '#FF4500',
    wechat: '#7BB32E'
  }[type];
};

const getSocialMediaUrl = (type: SocialMediaType, userId: string) => {
  return {
    keybase: 'https://keybase.io/' + userId.replace('@', ''),
    telegram: 'https://t.me/' + userId.replace('@', ''),
    twitter: 'https://twitter.com/' + userId.replace('@', ''),
    github: 'https://github.com/' + userId.replace('@', ''),
    youtube: 'https://youtube.com/channel/' + userId,
    facebook: 'https://facebook.com/' + userId,
    medium: 'https://medium.com/' + userId,
    reddit: 'https://reddit.com/' + userId,
    wechat: `weixin://dl/chat?${userId}/`
  }[type];
};

export type SocialMediaType =
  | 'keybase'
  | 'telegram'
  | 'twitter'
  | 'github'
  | 'youtube'
  | 'facebook'
  | 'medium'
  | 'reddit'
  | 'wechat';

/* eslint-disable-next-line */
export interface SvgIconSocialProps extends BaseProps {
  socialMediaType: SocialMediaType;
  userId: string;
}

const Container = styled(Link)<Omit<SvgIconSocialProps, 'userId'>>(
  ({ theme, socialMediaType: type }) => ({
    color: theme.color.fillSecondary,
    '&:hover': {
      color: getSocialMediaColor(type)
    },
    '&:active': {
      color: getSocialMediaColor(type)
    }
  })
);

export const SvgIconSocial = React.forwardRef<
  HTMLAnchorElement,
  SvgIconSocialProps
>(({ socialMediaType: type, userId, ...props }: SvgIconSocialProps, ref) => {
  return (
    <Container
      ref={ref}
      color="inherit"
      socialMediaType={type}
      href={getSocialMediaUrl(type, userId)}
      {...props}
    >
      <SvgIcon src={`assets/icons/ic-${type}.svg`} />
    </Container>
  );
});

export default SvgIconSocial;
