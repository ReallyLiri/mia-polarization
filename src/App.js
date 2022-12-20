import "./index.css"
import styled from "styled-components";
import { useCallback, useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { uniq } from "lodash/array";
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import uuid from "react-uuid";
import { debounce } from "lodash/function";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  border: 10px solid #228a8d;
  box-sizing: border-box;
  overflow: hidden;
`

const Markered = styled.div`
  text-align: center;
  padding: 4px;
  background-color: ${ ({ color }) => color };
  color: white;
  width: ${ ({ width }) => width }px;
  z-index: 1;
`

const Title = styled(Markered)`
  margin: 20px;
  font-size: 20px;
  align-self: center;
`

const Row = styled.div`
  margin: 2rem;
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 1rem;
  justify-content: start;
  align-items: start;
  flex-wrap: wrap;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
`

const CheckerColumn = styled(Column)`
  width: 200px;
`

const ExperimentsRow = styled(Column)`
  position: absolute;
  top: 80px;
  left: 280px;
  overflow: hidden;
  max-width: 1600px;
`

const ExperimentGif = styled.img`
  max-height: 20rem;
  width: auto;
  margin-left: -50px;
`

const VerticalDivider = styled.div`
  width: 5px;
  height: 800px;
  background-color: #440356;
  margin-right: 1rem;
`

const sortExperiments = (data) => data.sort((a, b) => a.eta - b.eta)

const loadCsv = (setSimRows, setRepRows) => {
  fetch('combined_experiments.csv')
    .then(response => {
      response.text().then(csv => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: results => {
            const sims = []
            const reps = []
            results.data.forEach(row => {
              const eta = row.radical_exposure_eta
              const data = {
                experimentId: row.experiment_id,
                eta: eta === "NULL" ? null : parseFloat(eta),
              }
              if ( row.simulation_type === "SIMILARITY" ) {
                sims.push(data)
              } else if ( row.simulation_type === "REPULSIVE" ) {
                reps.push(data)
              }
            })
            setSimRows(sortExperiments(sims))
            setRepRows(sortExperiments(reps))
          },
        });
      })
    })
}

const Experiment = ({ experimentId, eta }) => {
  const title = eta === null ? 'Vanilla' : `η=${ eta }`;
  return <div style={ { display: "flex", flexDirection: "column", alignItems: "center" } }>
    <ExperimentGif src={ `figures/${ experimentId }.gif` } alt={ experimentId }
                   title={ title }/>
    <div>{ title }</div>
  </div>;
}

const CheckboxRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-left: 16px;
  margin-top: 8px;
  justify-content: start;
  gap: 8px;
`

const Checkbox = styled.input`
  accent-color: #440356;
`

const Button = styled.div`
  width: 60px;
  border-radius: 4px;
  background-color: #228a8d;
  color: white;
  padding: 4px;
  text-align: center;
  cursor: pointer;
`

const EtaCheckbox = ({ eta, checked, onCheck }) => <CheckboxRow>
  <Checkbox type="checkbox" checked={ checked } onChange={ onCheck } disabled={ eta === null }/>
  <div>{ eta || 'Vanilla' }</div>
</CheckboxRow>

const StyledDropdown = styled(Dropdown)`
  margin-top: 8px;
  margin-bottom: 32px;
`

const SIMILARITIES = 'Similarities'
const REPULSIVE = 'Repulsive'

const LIMIT = 8

const showAlert = (message) => {
  alert(message)
}

const App = () => {

  const [simRows, setSimRows] = useState([])
  const [repRows, setRepRows] = useState([])
  const [etas, setEtas] = useState([])
  const [selectedEtas, setSelectedEtas] = useState([])
  const [mode, setMode] = useState(SIMILARITIES)

  const filterRows = useCallback((rows) => {
    if ( selectedEtas === undefined ) {
      return rows
    }
    return rows.filter(data => data.eta === null || selectedEtas.includes(data.eta)).slice(0, LIMIT)
  }, [selectedEtas])

  const similarities = useMemo(() => filterRows(simRows), [filterRows, simRows])

  const repulsive = useMemo(() => filterRows(repRows), [filterRows, repRows])

  useEffect(() => loadCsv(setSimRows, setRepRows), [])

  useEffect(() => {
    const allEtas = uniq(simRows.map(data => data.eta));
    setEtas(allEtas)
    setSelectedEtas(allEtas.slice(0, LIMIT))
  }, [simRows])

  return (
    <Container>
      <Title color='#228a8d' width={ 160 }>Polarization</Title>
      <Row>
        <CheckerColumn>
          <div>Experiments set:</div>
          <StyledDropdown options={ [SIMILARITIES, REPULSIVE] } onChange={ option => setMode(option.value) }
                          value={ mode } placeholder="Select an option"/>
          <Markered width={ 200 } color="#440356">Choose η values</Markered>
          <CheckboxRow>
            <Button title={ `First ${ LIMIT } options` }
                    onClick={ () => setSelectedEtas(etas.slice(0, LIMIT)) }>Basic</Button>
            <Button title="None" onClick={ () => setSelectedEtas([null]) }>None</Button>
          </CheckboxRow>
          {
            etas.map(eta => <EtaCheckbox key={ eta } eta={ eta } checked={ selectedEtas.includes(eta) } onCheck={
              () => setSelectedEtas(curr => {
                  const next = curr.includes(eta) ? curr.filter(e => e !== eta) : [...curr, eta]
                  if ( next.length > LIMIT ) {
                    showAlert(`Sorry, selection is limited to ${ LIMIT } values`)
                    return curr
                  }
                  return next
                }
              )
            }/>)
          }
        </CheckerColumn>
        <VerticalDivider/>
        <ExperimentsRow>
          <Row>
            {
              mode === SIMILARITIES
                ? similarities.map(row => <Experiment key={ uuid() } { ...row }/>)
                : repulsive.map(row => <Experiment key={ uuid() } { ...row }/>)
            }
          </Row>
        </ExperimentsRow>
      </Row>
    </Container>
  );
};

export default App;
