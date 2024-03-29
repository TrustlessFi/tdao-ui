import {
  Dropdown,
  OnChangeData,
} from 'carbon-components-react'
import { useState, CSSProperties } from 'react'
import { useHistory } from 'react-router-dom'

const InputPicker = <
  T extends string,
  TEnumValue extends string,
>({
  options,
  initialValue,
  style,
  navigation,
  onChange,
  label,
  width,
}:{
  options: { [key in T]: TEnumValue }
  onChange?: (changedTo: TEnumValue) => void
  navigation?: {[key in TEnumValue]?: string}
  initialValue: TEnumValue,
  style?: CSSProperties,
  label: string
  width: number
}) => {
  const history = useHistory()

  const [selectedItem, setSelectedItem] = useState<TEnumValue>(initialValue)

  return (
    <div style={{display: 'inline-block', width, marginTop: 8}} >
      <Dropdown
        ariaLabel="Dropdown"
        id={label}
        items={Object.values(options)}
        onChange={(data: OnChangeData<TEnumValue>) => {
          const newSelectedItem = data.selectedItem
          if (newSelectedItem === null || newSelectedItem === undefined) return
          else if (onChange !== undefined) {
            onChange(newSelectedItem)
          } else if (navigation !== undefined) {
            const currentSelectedItem = selectedItem
            setSelectedItem(newSelectedItem)
            const nav = navigation[newSelectedItem]
            if (
              newSelectedItem !== initialValue
              && currentSelectedItem !== newSelectedItem
              && nav !== undefined) {
              history.push(nav)
            }
          }
        }}
        size="lg"
        initialSelectedItem={initialValue}
        label={label}
        titleText={<> </>}
        style={style === undefined ? {marginLeft: 8, marginRight: 8, width} : style}
      />
    </div>
  )
}

InputPicker.defaultProps = {
  width: 146,
}



export default InputPicker
