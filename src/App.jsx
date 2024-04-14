/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-useless-escape */
import "./App.css";
import "//unpkg.com/mathlive";
import { useState, useRef, useEffect } from "react";
import nerdamer from "nerdamer/all";
import { Button } from "primereact/button";
import { CiCalculator2 } from "react-icons/ci";
import {
	SingularSolution,
	firstSteps,
	parametricSolutions
} from "./utils/formulas";

function App() {
	const [value, setValue] = useState("");
	const [results, setResults] = useState([]);
	const [equations, setEquations] = useState({
		chosen: "",
		results: [],
		selectable: false,
		index: -1,
		second: {},
		stepNumber: 0
	});

	const calc = async (e) => {
		setEquations({
			chosen: "",
			results: [],
			selectable: false,
			index: -1,
			second: {},
			stepNumber: 0
		});
		e.preventDefault();

		let input = mf.current.value;
		while (input.includes("y^{\\prime}")) {
			input = input.replace("y^{\\prime}", "P");
		}
		input = input.replace("y=", "");
		input = input.replace("=y", "");

		let f = nerdamer.convertFromLaTeX(input).toString();

		const first = await firstSteps(f, mf.current.value);
		const second = await parametricSolutions(
			first.expr,
			first.fDiff,
			first.results
		);

		const third = await SingularSolution(
			second.expr,
			second.fDiff,
			second.results,
			second.x
		);

		if (third.selectable && third.stepNumber === 2) {
			setEquations({
				chosen: "",
				results: third.results,
				selectable: true,
				index: -1,
				second,
				stepNumber: 2
			});

			setResults(second.results);
			return;
		}

		if (third.selectable && third.stepNumber === 3) {
			setEquations({
				chosen: "",
				results: third.results,
				selectable: true,
				index: -1,
				second,
				stepNumber: 3,
				x: third.x
			});
			setResults(second.results);

			return;
		}

		setResults(third.results);
	};

	const thirdStep = async () => {
		if (equations.stepNumber === 2) {
			const third = await SingularSolution(
				equations.second.expr,
				equations.second.fDiff,
				equations.second.results,
				equations.chosen
			);
			setResults(third.results);
		}
		if (equations.stepNumber === 3) {
			const third = await SingularSolution(
				equations.second.expr,
				equations.second.fDiff,
				equations.second.results,
				equations.x,
				equations.chosen
			);
			setResults(third.results);
			setEquations({
				chosen: "",
				results: [],
				selectable: false,
				index: -1,
				second: {},
				stepNumber: 0
			});
		}
	};

	// Customize the mathfield when it is mounted
	const mf = useRef();
	useEffect(() => {
		// Read more about customizing the mathfield: https://cortexjs.io/mathlive/guides/customizing/
		mf.current.smartFence = true;
		mf.current.focus();

		// This could be an `onInput` handler, but this is an alternative
		mf.current.addEventListener("input", (evt) => {
			evt.preventDefault();
			evt.stopPropagation();
			// When the return key is pressed, play a sound
			if (evt.inputType === "insertLineBreak") {
				// The mathfield is available as `evt.target`
				// The mathfield can be controlled with `executeCommand`
				// Read more: https://cortexjs.io/mathlive/guides/commands/
				evt.target.executeCommand("plonk");
			}
		});
	}, []);

	// Update the mathfield when the value changes
	useEffect(() => {
		mf.current.value = value;
	}, [value]);

	useEffect(() => {
		if (equations.index === -1) return;

		thirdStep();
	}, [equations]);

	return (
		<form className="App" onSubmit={calc}>
			<h1>Método Clairaut</h1>
			<math-field ref={mf} onInput={(evt) => setValue(evt.target.value)}>
				{value}
			</math-field>
			<Button type="submit" label="Calcular" />
			{results.map((step, index) => (
				<div key={"step " + index}>
					{step.title ? (
						<h3 style={{ textAlign: "center" }}>{step.title}</h3>
					) : (
						<></>
					)}
					{step.value ? <math-field read-only>{step.value}</math-field> : <></>}
				</div>
			))}
			{!equations.chosen && equations.selectable ? (
				equations.results.map((step, index) => (
					<div key={"step " + index} id="options">
						<math-field
							style={{
								borderRadius: equations.selectable ? "8px 0 0 8px" : "8px"
							}}
							read-only
						>
							{nerdamer.convertToLaTeX(step).toString()}
						</math-field>
						{equations.selectable && !equations.chosen ? (
							<button
								className={equations.index === index ? "active" : ""}
								onClick={() =>
									setEquations({
										...equations,
										index,
										chosen: [equations.results[index]],
										results: [],
										selectable: false
									})
								}
								aria-label="Take a photo"
							>
								<CiCalculator2 />
							</button>
						) : (
							<></>
						)}
					</div>
				))
			) : (
				<></>
			)}
		</form>
	);
}

export default App;
