
function Validator(formSelector) {

	function getParent(element, selector) {
		while (element.parentElement) {
			if (element.parentElement.matches(selector)) {
				return element.parentElement
			}
			element = element.parentElement
		}
	}

	const validatorRules = {
		required: value =>
			value ? undefined : 'Vui lòng nhập trường này',
		email: value => {
			const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
			return regex.test(value) ? undefined : 'Trường này phải là email'
		},
		min: min => value => value.length >= min ? undefined : `Vui lòng nhập tối thiểu ${min} kí tự`,
		max: max => value => value.length <= max ? undefined : `Vui lòng nhập tối đa ${max} kí tự`,
		match: selector => value => 
			document.querySelector(selector).value === value ? undefined : 'Giá trị nhập vào không chính xác',
	}
	const formRules = {}
	const formElement = document.querySelector(formSelector)
	
	if (formElement) {
		const inputs = formElement.querySelectorAll('[name][rules]')
		
		Array.from(inputs).forEach(input => {
			let rules = input.getAttribute('rules').split('|')

			rules.forEach(rule => {
				let isRuleHasValue = rule.includes(':')
				let ruleInfo

				if (isRuleHasValue) {
					ruleInfo = rule.split(':')

					rule = ruleInfo[0]
				}

				let ruleFunc = validatorRules[rule]

				if (isRuleHasValue) {
					ruleFunc = ruleFunc(ruleInfo[1])
				}
				
				if (Array.isArray(formRules[input.name])){
					formRules[input.name].push(ruleFunc)
				} else {
					formRules[input.name] = [ruleFunc]
				}

			})

			input.onblur = handleValidate
			input.oninput = handleClearError
		})

		function handleValidate(e) {
			const rules = formRules[e.target.name]
			let errorMessage

			for (let rule of rules) {
				switch (e.target.type) {
					case 'radio':
					case 'checkbox':
						errorMessage = rule(
							document.querySelector('[name=' + e.target.name + ']:checked')
						)
						break
					default:
						errorMessage = rule(e.target.value)
				}
				if (errorMessage) break
			}

			if (errorMessage) {
				let formGroup = getParent(e.target, '.form-group')

				if (formGroup) {
					formGroup.classList.add('invalid')

					let formMessage = formGroup.querySelector('.form-message')
					
					if (formMessage) {
						formMessage.innerText = errorMessage
					}
				}
			}

			return !errorMessage
		}

		function handleClearError(e) {
			let formGroup = getParent(e.target, '.form-group')

			if (formGroup.classList.contains('invalid')) {
				formGroup.classList.remove('invalid')
				
				let formMessage = formGroup.querySelector('.form-message')
					
				if (formMessage) {
					formMessage.innerText = ''
				}
			}
		}


		formElement.onsubmit = (e) => {
			e.preventDefault()
			let isValid = true

			Array.from(inputs).forEach(input => {
				if (!handleValidate({ target: input })) {
					isValid = false
				}
			})

			if (isValid) {
				if (this.onSubmit) {
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
					
					this.onSubmit(formValues)
				} else {
					formElement.submit()
				}
			}
		}
	}

}
