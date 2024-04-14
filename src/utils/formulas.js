import nerdamer from "nerdamer/all";

nerdamer.setFunction("ln", "x", "log(x)");
nerdamer.setFunction("ln", "P", "log(P)");

export const toPython = (expr) => {
	while (expr.includes("^")) {
		expr = expr.replace("^", "**");
	}
	return expr;
};

export const toJS = (expr) => {
	while (expr.includes("**")) {
		expr = expr.replace("**", "^");
	}
	return expr;
};

export const firstSteps = async (expr, TexInput) => {
	let f = expr;
	const results = [{ title: "", value: `${TexInput}` }];
	console.log(expr);
	let fDiff = nerdamer.diff(f).toString();
	results.push({
		title: "",
		value: `y=${nerdamer.convertToLaTeX(f).toString()}`
	});
	results.push({
		value: `y'=${nerdamer.convertToLaTeX(fDiff).toString()}`,
		title: ""
	});
	results.push({
		value: `P=${nerdamer.convertToLaTeX(fDiff).toString()}`,
		title: ""
	});
	results.push({
		title: "",
		value: `${nerdamer.convertToLaTeX(fDiff).toString()}=0`
	});
	results.push({ title: "Solución General", value: "P'=0" });
	results.push({ title: "", value: "P=C" });
	while (f.includes("P")) {
		f = f.replace("P", "C");
	}
	results.push({
		title: "",
		value: `y=${nerdamer.convertToLaTeX(f).toString()}`
	});

	return { expr, fDiff, results };
};

export const parametricSolutions = async (expr, fDiff, results) => {
	console.log(fDiff);
	let res1 = await fetch("http://127.0.0.1:5000/api/solve", {
		method: "POST",
		body: JSON.stringify({
			f: toPython(fDiff),
			var: "x"
		}),
		headers: {
			"Content-Type": "application/json"
		}
	});

	let x = await res1.json();
	x = x.sol.map((sol) => toJS(sol));

	return { expr, fDiff, results, x };
};

export const SingularSolution = async (expr, fDiff, results, x, sol = []) => {
	if (x.length > 1) {
		return { results: x, selectable: true, stepNumber: 2 };
	}
	let part = nerdamer(expr).sub("x", x[0]).toString();

	if (sol.length === 0) {
		console.log(fDiff);
		let res = await fetch("http://127.0.0.1:5000/api/solve", {
			method: "POST",
			body: JSON.stringify({
				f: toPython(fDiff),
				var: "P"
			}),
			headers: {
				"Content-Type": "application/json"
			}
		});

		sol = await res.json();
		sol = sol.sol;
		console.log(sol);
		console.log(nerdamer(fDiff).solveFor("P").toString());
		sol = sol.map((s) => toJS(s));
		console.log(sol);

		results.push({ title: "Soluciones Paramétricas", value: `` });
		results.push({
			title: "",
			value: `x=${nerdamer.convertToLaTeX(x[0]).toString()}`
		});

		console.log(results);

		results.push({
			title: "",
			value: `y=${nerdamer.convertToLaTeX(part).toString()}`
		});
		results.push({
			title: "Solución Singular",
			value: ``
		});

		console.log(results);

		if (sol.length > 1) {
			return { results: sol, selectable: true, stepNumber: 3, x };
		}
	}
	console.log(results);

	results.push({
		title: "",
		value: `P=${nerdamer.convertToLaTeX(sol[0]).toString()}`
	});
	console.log(results);
	console.log(part);
	console.log(expr);

	let y = nerdamer(expr).sub("P", sol[0]).toString();
	console.log(y);
	let tex;

	try {
		tex = nerdamer.convertToLaTeX(y).toString();
	} catch (error) {
		tex = nerdamer
			.convertToLaTeX(nerdamer(`simplify(${y})`).toString())
			.toString();
	}

	results.push({
		title: "",
		value: `y=${tex}`
	});

	console.log(results);

	return { results, selectable: false };
};
