function Validator(options) {
	let selectorRules = {}

	function getParentElement(element, selector) {
		while (element.parentElement) {
			if (element.parentElement.matches(selector)) {
				return element.parentElement
			}
			element = element.parentElement
		}
	}

	function validate(inputElement, rule) {
		const errorElement = getParentElement(inputElement, options.formGroupSelector).querySelector(options.errorSelector)
		let errorMessage

		let rules = selectorRules[rule.selector]

		for (let i = 0; i < rules.length; i++) {
			switch (inputElement.type) {
				case 'radio':
				case 'checkbox':
					errorMessage = rules[i](
						document.querySelector(rule.selector + ':checked')
					)
					break
				default:
					errorMessage = rules[i](inputElement.value)
			}
			if (errorMessage) break
		}

		if (errorMessage) {
			getParentElement(inputElement, options.formGroupSelector).classList.add('invalid')
			errorElement.innerText = errorMessage
		} else {
			getParentElement(inputElement, options.formGroupSelector).classList.remove('invalid')
			errorElement.innerText = ''
		}

		return !errorMessage
	}

	const formElement = document.querySelector(options.form)
	
	if (formElement) {
		formElement.onsubmit = (e) => {
			e.preventDefault()

			let isFormValid = true

			options.rules.forEach(rule => {
				let inputElement = formElement.querySelector(rule.selector)

				let isValid = validate(inputElement, rule)

				if (!isValid) {
					isFormValid = false
				}
			})

			if (isFormValid) {
				if (typeof options.onSubmit === 'function') {
					const enableInputs = formElement.querySelectorAll('[name]:not([disabled])')
					const formValues = Array.from(enableInputs).reduce((value, input) => 
					{
						switch(input.type) {
							case 'radio':
								if (input.matches(':checked')) {
									value[input.name] = input.value
									break
								}
								break
							case 'checkbox':
								if (!Array.isArray(value[input.name])) {
									if (input.matches(':checked')) {
										value[input.name] = [input.value]
									} else {
										value[input.name] = []
									}
								} else {
									if (input.matches(':checked')) {
										value[input.name].push(input.value)
									}
								}
								break
							case 'file':
								value[input.name] = input.files
								break
							default:
								value[input.name] = input.value
						}
						return value
					}, {})

					options.onSubmit(formValues)
				} else {
					formElement.submit()
				}
			}
		}

		options.rules.forEach(rule => {
			let inputElements = formElement.querySelectorAll(rule.selector)
			
			if (Array.isArray(selectorRules[rule.selector])) {
				selectorRules[rule.selector].push(rule.test)
			} else {
				selectorRules[rule.selector] = [rule.test]
			}
			
			
			Array.from(inputElements).forEach(inputElement => {
				let errorElement = getParentElement(inputElement, options.formGroupSelector).querySelector(options.errorSelector)
				inputElement.onblur = () => {
					validate(inputElement, rule)
				}
	
				inputElement.oninput = () => {
					getParentElement(inputElement, options.formGroupSelector).classList.remove('invalid')
					errorElement.innerText = ''
				}
			})
		})
	}
}

Validator.isRequired = (selector, message) => ({
	selector,
	test(value) {
		return value ? undefined : message || 'Vui lòng nhập trường này!'
	}
})

Validator.isEmail = (selector, message) => ({
	selector,
	test(value) {
		const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

		return regex.test(value) ? undefined : message || 'Vui lòng nhập đúng email!'
	}
})

Validator.minLength = (selector, minLength, message) => ({
	selector,
	test(value) {
		return value.length >= minLength ? undefined : message || `Vui lòng nhập tối thiểu ${minLength} kí tự`
	}
})

Validator.isConfirmed = (selector, getConfirmValue, message) => ({
	selector,
	test(value) {
		return value === getConfirmValue() ? undefined : message || 'Giá trị nhập vào không chính xác'
	}
})
