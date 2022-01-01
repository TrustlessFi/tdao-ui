import { ReactNode } from 'react';
import {  CSSProperties } from 'react'

export enum ListDirection {
  Row = 'Row',
  Col = 'Col',
}

const SpacedList = ({
  spacing,
  row,
  children,
  style,
}: {
  spacing: number,
  row: boolean,
  children: ReactNode | ReactNode[],
  style?: CSSProperties
}) => {
  return (
    <div style={style}>
      {Array.isArray(children)
        ? (row
          ? children.map((child, index) =>
            index === children.length - 1
              ? child
              : <span key={index} style={{ marginRight: spacing }}>{child}</span>)
          : children.map((child, index) =>
            index === children.length - 1
              ? child
              : <div key={index} style={{ marginBottom: spacing }}>{child}</div>
          )
        ) : children}
    </div>
  )
}

SpacedList.defaultProps = {
  row: false,
  small: false,
  spacing: 8,
}

export default SpacedList
