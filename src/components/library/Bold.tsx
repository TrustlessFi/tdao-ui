import { ReactNode } from "react";
import Text from './Text'

const Bold = ({ children }: { children: ReactNode }) =>
  <Text bold={true}>
    {children}
  </Text>

export default Bold
