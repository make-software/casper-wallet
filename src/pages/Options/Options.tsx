import React from 'react';
import { OptionsContainer } from './Options.styled';

interface Props {
  title: string;
}

const Options: React.FC<Props> = ({ title }: Props) => {
  return <OptionsContainer>{title} Page</OptionsContainer>;
};

export default Options;
