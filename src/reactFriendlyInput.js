import {Component, createElement} from 'react';

/**
 * Turns an input React component into a friendly input React component. A friendly input value can't be changed from
 * a parent when a user interacts with the input.
 *
 * All the given props are passed to the given input React component. If you need to get a reference to the React
 * element of the given component, use the `inputRef` prop like you would use the `ref` prop.
 *
 * @param {Function|string} Input The input React component. It is not modified. It can be either a HTML element (input,
 *     textarea, select) or another component which behaves the same way (has the value property and focus/blur events).
 * @return {Function} The friendly React component
 */
export default function reactFriendlyInput(Input)
{
	const name = Input instanceof Object ? Input.displayName || Input.name : Input;

	return class extends Component
	{
		/**
		 * {@inheritDoc}
		 */
		static displayName = `reactFriendlyInput(${name})`;

		/**
		 * The underlying controlled input
		 * @protected
		 * @type {HTMLElement|null}
		 */
		input = null;

		/**
		 * Is the input focused
		 * @protected
		 * @type {boolean}
		 */
		isFocused = false;

		/**
		 * {@inheritDoc}
		 */
		constructor(props)
		{
			super(props);

			this.receiveInput = this.receiveInput.bind(this);
			this.handleFocus = this.handleFocus.bind(this);
			this.handleBlur = this.handleBlur.bind(this);
		}

		/**
		 * Handles an underlying input reference from React.
		 *
		 * @protected
		 * @param {HTMLElement|null} input
		 */
		receiveInput(input)
		{
			this.input = input;
			this.sendInputToParent();
		}

		/**
		 * Sends the input ref to the parent (if it requires ref)
		 *
		 * @protected
		 */
		sendInputToParent()
		{
			const {inputRef} = this.props;

			// Ref can have different types: https://reactjs.org/docs/refs-and-the-dom.html
			if (isFunction(inputRef)) {
				inputRef(this.input);
			} else if (inputRef && typeof inputRef === 'object' && inputRef.hasOwnProperty('current')) {
				inputRef.current = this.input;
			}
		}

		/**
		 * Handles a native input `focus` event.
		 *
		 * @protected
		 * @param {*[]} args
		 */
		handleFocus(...args)
		{
			this.isFocused = true;

			if (isFunction(this.props.onFocus)) {
				this.props.onFocus(...args);
			}
		}

		/**
		 * Handles a native input `blur` event.
		 *
		 * @protected
		 * @param {*[]} args
		 */
		handleBlur(...args)
		{
			this.isFocused = false;

			if (isFunction(this.props.onBlur)) {
				this.props.onBlur(...args);
			}

			// If the input is controlled (has the value property), resets the native input value to the props value
			if (this.props.value !== undefined) {
				this.input.value = this.props.value;
			}
		}

		/**
		 * {@inheritDoc}
		 */
		render()
		{
			const {value, defaultValue, inputRef, ...props} = this.props;

			return createElement(Input, {
				...props,
				ref: this.receiveInput,
				onFocus: this.handleFocus,
				onBlur: this.handleBlur
			});
		}

		/**
		 * {@inheritDoc}
		 */
		componentDidMount()
		{
			if (this.isFocused) {
				return;
			}

			let value = '';
			if (this.props.value !== undefined) {
				value = this.props.value;
			} else if (this.props.defaultValue !== undefined) {
				value = this.props.defaultValue;
			}
			this.input.value = value;
		}

		/**
		 * {@inheritDoc}
		 */
		componentDidUpdate(prevProps)
		{
			// No value change from a parent when a user interacts with the input!
			if (this.isFocused) {
				return;
			}

			if (prevProps.value !== this.props.value && this.props.value !== undefined) {
				this.input.value = this.props.value;
			}

			// React doesn't call the ref function when the `inputRef` prop is changed so we have to handle it manually
			if (prevProps.inputRef !== this.props.inputRef) {
				this.sendInputToParent();
			}
		}
	};
}

/**
 * Friendly <input> React component
 * @see reactFriendlyInput What is "friendly"
 * @type {Function}
 */
export const Input = reactFriendlyInput('input');

/**
 * Friendly <textarea> React component
 * @see reactFriendlyInput What is "friendly"
 * @type {Function}
 */
export const TextArea = reactFriendlyInput('textarea');

/**
 * Friendly <select> React component
 * @see reactFriendlyInput What is "friendly"
 * @type {Function}
 */
export const Select = reactFriendlyInput('select');

/**
 * Checks whether the value is a function
 *
 * @param {*} value
 * @return {boolean}
 */
function isFunction(value)
{
	return typeof value === 'function';
}
